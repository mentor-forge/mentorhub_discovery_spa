describe('Navigation Drawer', () => {
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
    cy.visit('/discovery/')

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
    cy.visit('/discovery/')
    openDrawer()

    assertAlbHref('nav-customer-link', '/customer/')
    assertAlbHref('nav-customer-members-link', '/discovery/members/')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-products-link"]').should('not.exist')
  })

  it('shows products and settings only for an admin login', () => {
    cy.login(['admin'])
    cy.visit('/discovery/')
    openDrawer()

    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-settings-link', '/admin/settings')
    cy.get('[data-automation-id="nav-customer-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
  })

  it('shows only common catalog rows for a mentee-only login', () => {
    cy.login(['mentee'])
    cy.visit('/discovery/')
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

  it('should logout and redirect to IdP login', () => {
    cy.login(['mentee'])
    cy.visit('/discovery/')
    openDrawer()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().click()

    cy.origin('http://127.0.0.1:8080', () => {
      cy.location('pathname', { timeout: 10000 }).should('eq', '/login.html')
      cy.location('search').should('include', 'return_to=')
    })
  })
})
