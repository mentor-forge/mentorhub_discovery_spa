describe('Navigation Drawer', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const IDP_STUB_PATHNAME = '/login.html'

  beforeEach(() => {
    // Drawer coverage must remain on Discovery Home even when the live API happens
    // to return the single linked card that Home correctly auto-follows.
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

  const openDrawer = () => {
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click()
  }

  const removedCatalogIds = [
    'nav-products-link',
    'nav-customer-link',
    'nav-customer-members-link',
  ]

  const assertRemovedCatalogRows = () => {
    removedCatalogIds.forEach((automationId) => {
      cy.get(`[data-automation-id="${automationId}"]`).should('not.exist')
    })
  }

  const assertAlbHref = (automationId: string, pathname: string) => {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should(($link) => {
        const href = $link.attr('href')
        expect(href).to.eq(`http://localhost:8080${pathname}`)
        expect(href).not.to.include(':8398')
        expect(href).not.to.include('/discovery/discovery')
      })
  }

  it('renders the mentor catalog with Home and Events on the welcome origin', () => {
    cy.login(['mentor'])
    cy.visitPrefixed('/discovery/')

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Discovery')
    assertAlbHref('nav-profile-link', '/customer/profile/')

    openDrawer()
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    assertAlbHref('nav-resources-link', '/discovery/resources')
    assertAlbHref('nav-paths-link', '/discovery/paths')
    assertAlbHref('nav-plans-link', '/discovery/plans')
    cy.get('[data-automation-id="nav-notifications-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    assertRemovedCatalogRows()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('shows only Home and Events for a customer login', () => {
    cy.login(['customer'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    cy.get('[data-automation-id="nav-notifications-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    assertRemovedCatalogRows()
  })

  it('shows admin-only Notifications and hosting-origin Settings with token claims', () => {
    cy.intercept('GET', '**/discovery/api/config', {
      config_items: [],
      versions: [],
      enumerators: [],
      token: {
        profile_id: 'profile-e2e',
        customer_id: 'customer-e2e',
        mentor_id: 'mentor-e2e',
      },
    }).as('getAdminConfig')
    cy.login(['admin'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    cy.get('[data-automation-id="nav-settings-link"]')
      .should('have.attr', 'href', `${APP_ORIGIN}/discovery/config`)
      .and(($link) => {
        const href = $link.attr('href') ?? ''
        expect(href).to.include(':8398')
        expect(href).not.to.include(':8080')
        expect(href).not.to.include('/admin/settings')
        expect(href).not.to.include('/discovery/discovery')
      })
      .click()

    cy.wait('@getAdminConfig')
    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', '/discovery/config')
    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')

    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    assertRemovedCatalogRows()
  })

  it('shows only Home and Events for a mentee-only login', () => {
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    cy.get('[data-automation-id="nav-notifications-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-paths-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-plans-link"]').should('not.exist')
    assertRemovedCatalogRows()
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

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubIdpLoginUri()
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')
    openDrawer()
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
