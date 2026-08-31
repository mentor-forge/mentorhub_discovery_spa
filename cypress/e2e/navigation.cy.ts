describe('Navigation Drawer', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const IDP_STUB_PATHNAME = '/login.html'

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

  const assertAlbHref = (automationId: string, pathname: string) => {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should(($link) => {
        const href = $link.attr('href')
        expect(href).to.eq(`http://localhost:8080${pathname}`)
        expect(href).not.to.include(':8398')
        expect(href).not.to.include('/discovery/discovery')
      })
  }

  it('renders PageFrame chrome and absolute navigation hrefs', () => {
    cy.login(['mentor'])
    cy.visitPrefixed('/discovery/')

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Discovery')
    assertAlbHref('nav-profile-link', '/customer/profile/')

    openDrawer()
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    assertAlbHref('nav-resources-link', '/discovery/resources')
    assertAlbHref('nav-paths-link', '/discovery/paths')
    assertAlbHref('nav-plans-link', '/discovery/plans')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('shows customer catalog rows only for a customer login', () => {
    cy.login(['customer'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-customer-link', '/customer/')
    assertAlbHref('nav-customer-members-link', '/discovery/members/')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-products-link"]').should('not.exist')
  })

  it('shows products and settings only for an admin login', () => {
    cy.login(['admin'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-settings-link', '/admin/settings')
    cy.get('[data-automation-id="nav-customer-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
  })

  it('shows only common catalog rows for a mentee-only login', () => {
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')
    openDrawer()

    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    cy.get('[data-automation-id="nav-customer-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-customer-members-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-paths-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-plans-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-products-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubIdpLoginUri()
    cy.login(['mentee'])
    cy.visitPrefixed('/discovery/')
    openDrawer()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible').click()

    // `PageFrame` returns to the ROOT origin, not `/discovery/` (recorded spa_utils limitation),
    // so only the IdP pathname and the presence of `return_to` are asserted.
    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').should('include', 'return_to=')
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
