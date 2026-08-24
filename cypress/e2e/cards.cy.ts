const emptyConfig = {
  config_items: [],
  versions: [],
  enumerators: [],
}

describe('Discovery card grids', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/discovery/api/config', emptyConfig)
  })

  it('uses the root landing page and renders card names, markdown, and type appearances', () => {
    cy.intercept('GET', '**/discovery/api/cards', [
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

  it('visits every CardGrid route and accepts empty states', () => {
    const routes = [
      { source: 'home', path: '/discovery/', endpoint: 'cards' },
      { source: 'members', path: '/discovery/members/', endpoint: 'cards/members' },
      { source: 'resources', path: '/discovery/resources', endpoint: 'cards/resources' },
      { source: 'paths', path: '/discovery/paths', endpoint: 'cards/paths' },
      { source: 'plans', path: '/discovery/plans', endpoint: 'cards/plans' },
      { source: 'products', path: '/discovery/products', endpoint: 'cards/products' },
      {
        source: 'notifications',
        path: '/discovery/notifications',
        endpoint: 'cards/notifications',
      },
    ]

    routes.forEach(({ source, path, endpoint }) => {
      cy.intercept('GET', `**/discovery/api/${endpoint}`, []).as(`${source}Cards`)
      cy.visit(path)
      cy.wait(`@${source}Cards`)
      cy.location('pathname').should('eq', path)
      cy.url().should('not.include', '/discovery/discovery')
      cy.get(`[data-automation-id="discovery-${source}-empty"]`).should('be.visible')
    })
  })

  it('opens cross-journey card targets through :8080 and preserves external links', () => {
    cy.intercept('GET', '**/discovery/api/cards', [
      {
        _id: 'customer-target',
        name: 'Customer member',
        link: '/customer/members/customer-target',
        type: 'Member',
      },
      {
        _id: 'admin-target',
        name: 'Admin product',
        link: '/admin/products/admin-target',
        type: 'Resource',
      },
      {
        _id: 'mentor-target',
        name: 'Mentor path',
        link: '/mentor/paths/mentor-target',
        type: 'Path',
      },
      {
        _id: 'mentee-target',
        name: 'Mentee event',
        link: '/mentee/events/mentee-target',
        type: 'Event',
      },
      {
        _id: 'external-target',
        name: 'External resource',
        link: 'https://example.com/guide',
        type: 'Resource',
      },
    ]).as('getLinkedCards')

    cy.visit('/discovery/')
    cy.wait('@getLinkedCards')
    cy.window().then((win) => {
      cy.stub(win, 'open').as('openCardLink')
    })

    const targets = [
      ['customer-target', 'http://localhost:8080/customer/members/customer-target'],
      ['admin-target', 'http://localhost:8080/admin/products/admin-target'],
      ['mentor-target', 'http://localhost:8080/mentor/paths/mentor-target'],
      ['mentee-target', 'http://localhost:8080/mentee/events/mentee-target'],
      ['external-target', 'https://example.com/guide'],
    ]

    targets.forEach(([cardId, href]) => {
      cy.get(`[data-automation-id="discovery-card-${cardId}"]`).click()
      cy.get('@openCardLink').should('have.been.calledWith', href, '_self')
      expect(href).not.to.include('/discovery/discovery')
      if (!href.startsWith('https://example.com')) {
        expect(href).to.include(':8080')
      }
    })
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

    cy.intercept('GET', '**/discovery/api/cards', (request) => {
      request.reply(homeCards)
    }).as('getHomeCards')
    cy.intercept('POST', '**/discovery/api/notification/dismiss/notification-dismiss', (request) => {
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

  it('loads the retained admin route for an admin login', () => {
    cy.login(['admin'])
    cy.visit('/discovery/admin')

    cy.location('pathname').should('eq', '/discovery/admin')
    cy.contains('Admin - Configuration').should('be.visible')
    cy.get('[data-automation-id="page-frame-title"]').should('contain.text', 'Discovery')
  })
})
