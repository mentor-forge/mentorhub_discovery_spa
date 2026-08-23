describe('Navigation Drawer', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should open navigation drawer with hamburger menu', () => {
    cy.visit('/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-home-link"]').should('be.visible')
    cy.get('[data-automation-id="nav-resources-link"]').should('be.visible')
    cy.get('[data-automation-id="nav-paths-link"]').should('be.visible')
    cy.get('[data-automation-id="nav-plans-link"]').should('be.visible')
  })

  it('should not show mentee domain links in drawer', () => {
    cy.visit('/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-journey-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-journeys-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-ratings-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-notes-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-events-list-link"]').should('not.exist')
  })

  it('should have admin and logout at bottom of drawer', () => {
    cy.login(['admin'])
    cy.visit('/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-admin-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('should close drawer after navigation', () => {
    cy.login(['admin'])
    cy.visit('/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-admin-link"]').click()

    cy.wait(500)
    cy.get('[data-automation-id="nav-home-link"]').should('not.be.visible')
  })

  it('should logout and redirect to IdP login', () => {
    cy.visit('/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().click()

    cy.origin('http://127.0.0.1:8080', () => {
      cy.location('pathname', { timeout: 10000 }).should('eq', '/login.html')
      cy.location('search').should('include', 'return_to=')
    })
  })
})
