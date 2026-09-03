/**
 * Host routing and PageFrame wiring for Discovery.
 * Hamburger catalog role gates and collection hrefs are covered in spa_utils.
 */
describe('Navigation Drawer', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const IDP_STUB_PATHNAME = '/login.html'
  const CONFIG_PATHNAME = '/discovery/config'
  const STUB_DISPLAY_NAME = 'Ada Lovelace'

  const adminConfigBody = {
    config_items: [],
    versions: [],
    enumerators: [],
    token: {
      display_name: STUB_DISPLAY_NAME,
      profile_id: 'profile-e2e',
      customer_id: 'customer-e2e',
      mentor_id: 'mentor-e2e',
    },
  }

  beforeEach(() => {
    // Stay on Discovery Home even when the live API returns a single auto-follow card.
    cy.intercept('GET', '**/discovery/api/cards', [])
  })

  /** Point the container's IdP at a same-origin stub: the real value may be a cross-origin
   *  Tailscale MagicDNS host, and `runtime-config.js` is the highest-priority source. */
  function stubIdpLoginUri() {
    cy.intercept('GET', '**/discovery/runtime-config.js', {
      statusCode: 200,
      headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' },
      body: `window.__MENTORHUB_RUNTIME__ = Object.assign(window.__MENTORHUB_RUNTIME__ || {}, { IDP_LOGIN_URI: '${APP_ORIGIN}${IDP_STUB_PATHNAME}' });`,
    }).as('getRuntimeConfig')

    cy.intercept('GET', `**${IDP_STUB_PATHNAME}*`, {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Stub IdP</title></head><body>stub idp login</body></html>',
    }).as('getIdpLogin')
  }

  function stubAdminConfig() {
    cy.intercept('GET', '**/discovery/api/config', adminConfigBody).as('getAdminConfig')
  }

  /**
   * Patch the stored Cypress JWT with `display_name` and reload so packaged
   * PageFrame `readDisplayName()` sees the claim. `signCypressJwt` omits it;
   * do not vendor spa_utils demo `stubJwtDisplayName`.
   */
  function stubStoredJwtDisplayName(displayName = STUB_DISPLAY_NAME) {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token')
      if (!token) {
        throw new Error('stubStoredJwtDisplayName requires an access_token in localStorage')
      }
      const parts = token.split('.')
      if (parts.length < 2 || !parts[1]) {
        throw new Error('stubStoredJwtDisplayName: access_token is not a JWT')
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>
      payload.display_name = displayName
      const encoded = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      win.localStorage.setItem('access_token', `${parts[0]}.${encoded}.${parts[2] ?? ''}`)
    })
    cy.reload()
  }

  it('shows Discovery PageFrame chrome', () => {
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Discovery')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-profile-link"]').should('be.visible')
    // signCypressJwt omits display_name — compact avatar-only chrome.
    cy.get('[data-automation-id="nav-profile-name-display"]').should('not.exist')
  })

  it('hosts Settings at /discovery/config for admin with token claims', () => {
    stubAdminConfig()
    cy.login(['admin'])
    cy.visitPrefixed('/discovery/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click()

    cy.get('[data-automation-id="nav-settings-link"]')
      .should('have.attr', 'href', `${APP_ORIGIN}${CONFIG_PATHNAME}`)
      .click()

    cy.wait('@getAdminConfig')
    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/discovery/discovery')
    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-display-name-display"]')
      .find('input')
      .should('have.value', STUB_DISPLAY_NAME)
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')
  })

  it('shows N/A on Token tab when config token omits display_name', () => {
    const { display_name: _omitted, ...idsOnly } = adminConfigBody.token
    cy.intercept('GET', '**/discovery/api/config', {
      ...adminConfigBody,
      token: {
        ...idsOnly,
        name: 'Should Not Appear',
        given_name: 'Also Hidden',
        email: 'hidden@example.com',
      },
    }).as('getAdminConfigMissingDisplayName')

    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)
    cy.wait('@getAdminConfigMissingDisplayName')
    cy.url().should('not.include', '/discovery/discovery')

    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-display-name-display"]')
      .find('input')
      .should('have.value', 'N/A')
      .and('not.have.value', 'Should Not Appear')
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')
  })

  it('shows JWT display_name in PageFrame chrome when the claim is stubbed', () => {
    stubAdminConfig()
    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)
    cy.wait('@getAdminConfig')
    stubStoredJwtDisplayName(STUB_DISPLAY_NAME)

    cy.get('[data-automation-id="nav-profile-link"]')
      .should('be.visible')
      .find('[data-automation-id="nav-profile-name-display"]')
      .should('be.visible')
      .and('contain', STUB_DISPLAY_NAME)
  })

  it('serves Events and gates Config by admin role', () => {
    cy.intercept('GET', '**/discovery/api/cards/events', []).as('getEvents')
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/events')
    cy.wait('@getEvents')
    cy.location('pathname').should('eq', '/discovery/events')
    cy.url().should('not.include', '/discovery/discovery')
    cy.get('[data-automation-id="discovery-events-empty"]').should('be.visible')

    cy.visitPrefixed('/discovery/config')
    cy.location('pathname').should('eq', '/discovery/')

    cy.intercept('GET', '**/discovery/api/config', {
      config_items: [],
      versions: [],
      enumerators: [],
    }).as('getAdminConfig')
    cy.login(['admin'])
    cy.visitPrefixed('/discovery/config')
    cy.wait('@getAdminConfig')
    cy.location('pathname').should('eq', '/discovery/config')
  })

  it('renders placeholder text on the notification detail route', () => {
    cy.login()
    cy.visitPrefixed('/discovery/notification/665f1c2a9b1e4c0a1b2c3d21')
    cy.location('pathname').should('eq', '/discovery/notification/665f1c2a9b1e4c0a1b2c3d21')
    cy.get('[data-automation-id="notification-view-placeholder"]')
      .should('be.visible')
      .and('contain.text', 'Notification details will appear here.')
    cy.get('[data-automation-id="notification-view-id"]')
      .should('contain.text', '665f1c2a9b1e4c0a1b2c3d21')
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubIdpLoginUri()
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible').click()

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to')
      expect(returnTo, 'logout return_to').not.to.equal(null)
      const returnUrl = new URL(returnTo!)
      expect(returnUrl.hostname).to.equal('localhost')
      expect(returnUrl.port).to.equal('8080')
      expect(returnUrl.pathname).to.equal('/discovery/')
      expect(returnUrl.href).not.to.include('127.0.0.1')
      expect(returnUrl.href).not.to.include('/discovery/discovery')
    })
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal(null)
      expect(win.localStorage.getItem('user_roles')).to.equal(null)
    })
  })

  it('should serve the real container IdP config from the prefixed runtime-config.js', () => {
    cy.request('/discovery/runtime-config.js').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.headers['cache-control']).to.contain('no-store')

      const configured = /IDP_LOGIN_URI:\s*'([^']+)'/.exec(String(response.body))?.[1] ?? ''
      expect(new URL(configured).pathname).to.equal('/login.html')
      expect(new URL(configured).port).to.equal('8080')
    })
  })
})
