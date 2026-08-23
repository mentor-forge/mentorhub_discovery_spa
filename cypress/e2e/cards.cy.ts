const emptyConfig = {
  config_items: [],
  versions: [],
  enumerators: [],
}

describe('Discovery card grids', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/config', emptyConfig)
  })

  it('uses the root landing page and renders card names, markdown, and type appearances', () => {
    cy.intercept('GET', '**/api/cards', [
      {
        _id: 'resource-markdown',
        name: 'Vue Resource',
        description: '## Start here\n\nRead the **Vue guide**.',
        type: 'Resource',
      },
      {
        _id: 'path-markdown',
        name: 'Mentoring Path',
        description: 'Follow the *path*.',
        type: 'Path',
      },
    ]).as('getHomeCards')

    cy.visit('/discovery/')
    cy.wait('@getHomeCards')

    cy.location('pathname').should('eq', '/discovery/')
    cy.get('[data-automation-id="discovery-home-grid"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-markdown-title-display"]')
      .should('contain.text', 'Vue Resource')

    cy.get('[data-automation-id="discovery-card-resource-markdown-body-display"]')
      .within(() => {
        cy.get('h2').should('have.text', 'Start here')
        cy.get('strong').should('have.text', 'Vue guide')
      })
      .should('not.contain.text', '##')
      .and('not.contain.text', '**')

    cy.get('[data-automation-id="discovery-card-resource-markdown"]')
      .find('.mh-card__title-bar')
      .should('have.class', 'bg-green-darken-2')
    cy.get('[data-automation-id="discovery-card-path-markdown"]')
      .find('.mh-card__title-bar')
      .should('have.class', 'bg-indigo')
    cy.get('[data-automation-id="discovery-card-resource-markdown-type-icon"]')
      .should('have.attr', 'aria-label', 'Resource card')
    cy.get('[data-automation-id="discovery-card-path-markdown-type-icon"]')
      .should('have.attr', 'aria-label', 'Path card')
  })

  it('loads resources, paths, and plans and accepts their empty states', () => {
    cy.intercept('GET', '**/api/cards/resources', []).as('getResourceCards')
    cy.intercept('GET', '**/api/cards/paths', []).as('getPathCards')
    cy.intercept('GET', '**/api/cards/plans', []).as('getPlanCards')

    cy.visit('/discovery/resources')
    cy.wait('@getResourceCards')
    cy.get('[data-automation-id="discovery-resources-empty"]').should('be.visible')

    cy.visit('/discovery/paths')
    cy.wait('@getPathCards')
    cy.get('[data-automation-id="discovery-paths-empty"]').should('be.visible')

    cy.visit('/discovery/plans')
    cy.wait('@getPlanCards')
    cy.get('[data-automation-id="discovery-plans-empty"]').should('be.visible')
  })

  it('dismisses a linked Notification without navigating and removes it after refetch', () => {
    let homeCards = [
      {
        _id: 'notification-dismiss',
        name: 'Dismiss me',
        description: 'A **notification**.',
        link: '/must-not-navigate',
        type: 'Notification',
      },
    ]

    cy.intercept('GET', '**/api/cards', (request) => {
      request.reply(homeCards)
    }).as('getHomeCards')
    cy.intercept('POST', '**/api/notification/dismiss/notification-dismiss', (request) => {
      homeCards = []
      request.reply({
        statusCode: 200,
        body: {
          _id: 'notification-dismiss',
          name: 'Dismiss me',
          status: 'archived',
        },
      })
    }).as('dismissNotification')

    cy.visit('/discovery/')
    cy.wait('@getHomeCards')
    cy.get('[data-automation-id="discovery-card-notification-dismiss-dismiss-button"]')
      .click()
    cy.wait('@dismissNotification')
      .its('request.method')
      .should('eq', 'POST')
    cy.wait('@getHomeCards')

    cy.location('pathname').should('eq', '/discovery/')
    cy.get('[data-automation-id="discovery-card-notification-dismiss"]').should('not.exist')
    cy.get('[data-automation-id="discovery-home-empty"]').should('be.visible')
  })

  it('loads admin for an admin login and keeps Admin and Logout in the local drawer', () => {
    cy.login(['admin'])
    cy.visit('/discovery/')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    cy.get('[data-automation-id="nav-admin-link"]').scrollIntoView().should('be.visible').click()

    cy.location('pathname').should('eq', '/discovery/admin')
    cy.contains('Admin - Configuration').should('be.visible')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    cy.get('[data-automation-id="nav-admin-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })
})
