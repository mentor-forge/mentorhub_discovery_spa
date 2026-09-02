const emptyConfig = {
  config_items: [],
  versions: [],
  enumerators: [],
}

/** Assert a create/invite href is a welcome/ALB journey URL, not a debug-port or /new path. */
function assertJourneyCreateHref(href: string | undefined, expectedPathname: string) {
  expect(href, 'href must be present').to.be.a('string')
  const url = new URL(href!)
  expect(url.port).to.equal('8080')
  expect(url.pathname).to.equal(expectedPathname)
  expect(url.pathname.endsWith('/')).to.equal(true)
  expect(url.pathname).not.to.include('/new')
  expect(url.href).not.to.include(':8398')
  expect(url.href).not.to.include('/discovery/discovery')
}

function visitHomeWithOpenStub() {
  cy.visit('/discovery/', {
    onBeforeLoad(win) {
      cy.stub(win, 'open').as('openCardLink')
    },
  })
  cy.window().then((win) => {
    const [navigation] = win.performance.getEntriesByType('navigation')
    expect(new URL(navigation.name).pathname, 'document URL actually fetched')
      .to.equal('/discovery/')
  })
}

describe('Discovery card grids', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/discovery/api/config', emptyConfig)
  })

  it('uses the root landing page and renders card names, markdown, and type appearances', () => {
    cy.login()
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

    cy.visitPrefixed('/discovery/')
    cy.wait('@getHomeCards')

    // Exact pathname, not a suffix: createWebHistory('/discovery/') can rewrite an
    // un-prefixed document so location alone is not proof of the nginx prefix edge.
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

  it('stretches unequal cards to equal-height rows and fills wide grid tracks', () => {
    cy.viewport(1440, 900)
    cy.login(['mentor'])
    cy.intercept('GET', '**/discovery/api/cards/resources*', [
      {
        _id: 'layout-short',
        name: 'Short card',
        description: 'One line.',
        type: 'Resource',
      },
      {
        _id: 'layout-medium',
        name: 'Medium card',
        description: 'A medium card.\n\nWith another paragraph.',
        type: 'Resource',
      },
      {
        _id: 'layout-long',
        name: 'Long card',
        description: 'A much longer card.\n\nSecond paragraph.\n\nThird paragraph with more text.',
        type: 'Resource',
      },
      {
        _id: 'layout-fourth',
        name: 'Fourth card',
        description: 'Another short card.',
        type: 'Resource',
      },
    ]).as('getLayoutCards')

    cy.visitPrefixed('/discovery/resources')
    cy.wait('@getLayoutCards')

    cy.get('[data-automation-id="discovery-resources-grid"]').then(($grid) => {
      const columns = getComputedStyle($grid[0]).gridTemplateColumns.split(' ')
      expect(columns.length, 'wide viewport column count').to.be.at.least(3)
    })

    cy.get('[data-automation-id="discovery-resources-grid"] > .mh-card-grid__item')
      .then(($items) => {
        const firstRowTop = $items[0].getBoundingClientRect().top
        const firstRow = [...$items].filter(
          (item) => Math.abs(item.getBoundingClientRect().top - firstRowTop) < 1,
        )
        expect(firstRow.length, 'cards in first visual row').to.be.at.least(3)

        const heights = firstRow.map((item) => item.getBoundingClientRect().height)
        heights.forEach((height) => {
          expect(height, 'equal first-row card height').to.be.closeTo(heights[0], 0.5)
        })

        firstRow.forEach((item) => {
          const trackWidth = item.getBoundingClientRect().width
          const card = item.querySelector<HTMLElement>('.discovery-card')
          const mhCard = item.querySelector<HTMLElement>('.mh-card')
          expect(card, 'DiscoveryCard wrapper').not.to.equal(null)
          expect(mhCard, 'MhCard').not.to.equal(null)
          expect(card!.getBoundingClientRect().width, 'wrapper fills grid track')
            .to.be.closeTo(trackWidth, 0.5)
          expect(mhCard!.getBoundingClientRect().width, 'MhCard fills grid track')
            .to.be.closeTo(trackWidth, 0.5)
        })
      })
  })

  it('shows Resource and Event type hints on icon hover', () => {
    cy.login()
    cy.intercept('GET', '**/discovery/api/cards', [
      {
        _id: 'resource-hint',
        name: 'Resource hint',
        description: 'Resource.',
        type: 'Resource',
      },
      {
        _id: 'event-hint',
        name: 'Event hint',
        description: 'Event.',
        type: 'Event',
      },
    ]).as('getHintCards')

    cy.visitPrefixed('/discovery/')
    cy.wait('@getHintCards')

    cy.get('[data-automation-id="discovery-card-resource-hint-type-icon"]')
      .should('have.attr', 'aria-label', 'Resource card')
      .trigger('mouseenter')
    cy.contains('.v-overlay__content', /^Resource$/).should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-hint-type-icon"]')
      .trigger('mouseleave')

    cy.get('[data-automation-id="discovery-card-event-hint-type-icon"]')
      .should('have.attr', 'aria-label', 'Event card')
      .trigger('mouseenter')
    cy.contains('.v-overlay__content', /^Event$/).should('be.visible')
  })

  it('visits every CardGrid route and accepts empty states', () => {
    cy.login()
    const routes = [
      { source: 'home', path: '/discovery/', endpoint: 'cards' },
      { source: 'events', path: '/discovery/events', endpoint: 'cards/events' },
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
      cy.visitPrefixed(path)
      cy.wait(`@${source}Cards`)
      cy.location('pathname').should('eq', path)
      cy.url().should('not.include', '/discovery/discovery')
      cy.get(`[data-automation-id="discovery-${source}-empty"]`).should('be.visible')
    })
  })

  it('opens cross-journey card targets through :8080 and preserves external links', () => {
    cy.login()
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

    cy.visitPrefixed('/discovery/')
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

  it('lets a non-admin dismiss but not cancel without following the card link', () => {
    cy.login(['mentee'])
    let notifications = [
      {
        _id: 'notification-dismiss',
        name: 'Dismiss me',
        description: 'A **notification**.',
        link: '/must-not-navigate',
        type: 'Notification',
      },
    ]

    cy.intercept('GET', '**/discovery/api/cards/notifications*', (request) => {
      request.reply(notifications)
    }).as('getNotifications')
    cy.intercept('POST', '**/discovery/api/notification/dismiss/notification-dismiss', (request) => {
      notifications = []
      request.reply({
        statusCode: 200,
        body: {
          _id: 'notification-dismiss',
          name: 'Dismiss me',
          status: 'archived',
        },
      })
    }).as('dismissNotification')

    cy.visitPrefixed('/discovery/notifications')
    cy.wait('@getNotifications')
    cy.window().then((win) => {
      cy.stub(win, 'open').as('openCardLink')
    })
    cy.get('[data-automation-id="discovery-card-notification-dismiss-dismiss-button"]')
      .should('be.visible')
    cy.get('[data-automation-id="discovery-card-notification-dismiss-cancel-button"]')
      .should('not.exist')
    cy.get('[data-automation-id="discovery-card-notification-dismiss-dismiss-button"]')
      .click()
    cy.wait('@dismissNotification')
      .its('request.method')
      .should('eq', 'POST')
    cy.wait('@getNotifications')

    cy.get('@openCardLink').should('not.have.been.called')
    cy.location('pathname').should('eq', '/discovery/notifications')
    cy.get('[data-automation-id="discovery-card-notification-dismiss"]').should('not.exist')
    cy.get('[data-automation-id="discovery-notifications-empty"]').should('be.visible')
  })

  it('lets an admin cancel but not dismiss without following the card link', () => {
    cy.login(['admin'])
    let notifications = [
      {
        _id: 'notification-cancel',
        name: 'Cancel me',
        description: 'An admin notification.',
        link: '/must-not-navigate',
        type: 'Notification',
      },
    ]

    cy.intercept('GET', '**/discovery/api/cards/notifications*', (request) => {
      request.reply(notifications)
    }).as('getAdminNotifications')
    cy.intercept('POST', '**/discovery/api/notification/cancel/notification-cancel', (request) => {
      notifications = []
      request.reply({
        statusCode: 200,
        body: {
          _id: 'notification-cancel',
          name: 'Cancel me',
          status: 'archived',
        },
      })
    }).as('cancelNotification')

    cy.visitPrefixed('/discovery/notifications')
    cy.wait('@getAdminNotifications')
    cy.window().then((win) => {
      cy.stub(win, 'open').as('openCardLink')
    })
    cy.get('[data-automation-id="discovery-card-notification-cancel-cancel-button"]')
      .should('be.visible')
    cy.get('[data-automation-id="discovery-card-notification-cancel-dismiss-button"]')
      .should('not.exist')
    cy.get('[data-automation-id="discovery-card-notification-cancel-cancel-button"]')
      .click()
    cy.wait('@cancelNotification')
      .its('request.method')
      .should('eq', 'POST')
    cy.wait('@getAdminNotifications')

    cy.get('@openCardLink').should('not.have.been.called')
    cy.location('pathname').should('eq', '/discovery/notifications')
    cy.get('[data-automation-id="discovery-card-notification-cancel"]').should('not.exist')
    cy.get('[data-automation-id="discovery-notifications-empty"]').should('be.visible')
  })

  it('auto-follows exactly one linked Home card through its cardHref', () => {
    cy.login(['mentee'])
    cy.intercept('GET', '**/discovery/api/cards', [
      {
        _id: 'single-journey',
        name: 'Single journey',
        description: 'Continue the journey.',
        link: '/mentee/events/single-journey',
        type: 'Event',
      },
    ]).as('getSingleHomeCard')

    visitHomeWithOpenStub()
    cy.wait('@getSingleHomeCard')
    cy.get('@openCardLink').should(
      'have.been.calledOnceWith',
      'http://localhost:8080/mentee/events/single-journey',
      '_self',
    )
  })

  it('keeps a two-card Home result in the grid without auto-following', () => {
    cy.login(['mentee'])
    cy.intercept('GET', '**/discovery/api/cards', [
      {
        _id: 'first-home-card',
        name: 'First journey',
        link: '/mentee/events/first-home-card',
        type: 'Event',
      },
      {
        _id: 'second-home-card',
        name: 'Second journey',
        link: '/mentor/resources/second-home-card',
        type: 'Resource',
      },
    ]).as('getTwoHomeCards')

    visitHomeWithOpenStub()
    cy.wait('@getTwoHomeCards')
    cy.get('@openCardLink').should('not.have.been.called')
    cy.get('[data-automation-id="discovery-card-first-home-card"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-second-home-card"]').should('be.visible')
    cy.location('pathname').should('eq', '/discovery/')
  })

  it('loads Config as the preferred admin Settings host and retains the admin alias', () => {
    cy.login(['admin'])
    cy.visitPrefixed('/discovery/config')

    cy.location('pathname').should('eq', '/discovery/config')
    cy.contains('Admin - Configuration').should('be.visible')
    cy.get('[data-automation-id="page-frame-title"]').should('contain.text', 'Discovery')

    cy.visitPrefixed('/discovery/admin')
    cy.location('pathname').should('eq', '/discovery/admin')
    cy.contains('Admin - Configuration').should('be.visible')
  })

  it('provides Search by Name on non-home CardGrid lists and omits it on Home', () => {
    cy.login()
    cy.visitPrefixed('/discovery/')
    cy.get('[data-automation-id="discovery-home-search"]').should('not.exist')

    const resourceCards = [
      {
        _id: 'resource-vue',
        name: 'Vue Essentials',
        description: 'Guide to Vue.',
        type: 'Resource',
      },
      {
        _id: 'resource-react',
        name: 'React Overview',
        description: 'Guide to React.',
        type: 'Resource',
      },
    ]

    cy.intercept('GET', '**/discovery/api/cards/resources*', (req) => {
      const name = req.query.name as string | undefined
      if (!name) {
        req.reply(resourceCards)
      } else if (name.toLowerCase().includes('vue')) {
        req.reply([resourceCards[0]])
      } else {
        req.reply([])
      }
    }).as('getResources')

    cy.visitPrefixed('/discovery/resources')
    cy.wait('@getResources')

    cy.get('[data-automation-id="discovery-resources-search"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-vue"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-react"]').should('be.visible')

    // Search with match — debounce must emit name= before the typed-list GET fires.
    cy.get('[data-automation-id="discovery-resources-search"] input').type('Vue')
    cy.wait('@getResources').then((interception) => {
      expect(interception.request.url).to.include('name=Vue')
      expect(interception.request.url).to.include('/discovery/api/cards/resources')
    })
    cy.get('[data-automation-id="discovery-card-resource-vue"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-react"]').should('not.exist')

    // Search with no match
    cy.get('[data-automation-id="discovery-resources-search"] input').clear().type('Nonexistent')
    cy.wait('@getResources').then((interception) => {
      expect(interception.request.url).to.include('name=Nonexistent')
    })
    cy.get('[data-automation-id="discovery-resources-empty"]').should('be.visible')

    // Clear search restores unfiltered cards
    cy.get('[data-automation-id="discovery-resources-search"] input').clear()
    cy.wait('@getResources').then((interception) => {
      expect(interception.request.url).not.to.include('name=')
    })
    cy.get('[data-automation-id="discovery-card-resource-vue"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-resource-react"]').should('be.visible')

    // Also verify search exists on paths
    cy.intercept('GET', '**/discovery/api/cards/paths*', []).as('getPaths')
    cy.visitPrefixed('/discovery/paths')
    cy.wait('@getPaths')
    cy.get('[data-automation-id="discovery-paths-search"]').should('be.visible')
  })

  it('filters notifications client-side and never sends name= to the API', () => {
    // Notifications intentionally differ from typed lists: Discovery filters the loaded
    // page in the browser because the live notifications list contract has no name query.
    cy.login()
    const notifications = [
      {
        _id: 'notif-welcome',
        name: 'Welcome Alert',
        description: 'Hello',
        type: 'Notification',
      },
      {
        _id: 'notif-maintenance',
        name: 'System Maintenance',
        description: 'Down',
        type: 'Notification',
      },
    ]

    cy.intercept('GET', '**/discovery/api/cards/notifications*', (req) => {
      expect(req.url, 'notifications must not receive API name filtering').not.to.include('name=')
      req.reply(notifications)
    }).as('getNotifications')

    cy.visitPrefixed('/discovery/notifications')
    cy.wait('@getNotifications')

    cy.get('[data-automation-id="discovery-notifications-search"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-notif-welcome"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-notif-maintenance"]').should('be.visible')

    cy.get('[data-automation-id="discovery-notifications-search"] input').type('Welcome')
    // Client-side filter: Welcome stays, Maintenance goes. Query-key changes may refetch
    // the same pagination-only endpoint, but never with name=.
    cy.get('[data-automation-id="discovery-card-notif-welcome"]').should('be.visible')
    cy.get('[data-automation-id="discovery-card-notif-maintenance"]').should('not.exist')

    cy.get('@getNotifications.all').then((calls) => {
      expect(calls.length).to.be.greaterThan(0)
      calls.forEach((call) => {
        expect(call.request.url).not.to.include('name=')
        expect(call.request.url).to.include('/discovery/api/cards/notifications')
      })
    })
  })

  it('renders Invite Member on Home for coordinator login', () => {
    cy.intercept('GET', '**/discovery/api/cards', []).as('getHome')
    cy.login(['coordinator'])
    cy.visitPrefixed('/discovery/')
    cy.wait('@getHome')

    cy.get('[data-automation-id="discovery-home-invite-member-button"]')
      .should('be.visible')
      .and(($btn) => {
        assertJourneyCreateHref($btn.attr('href'), '/customer/members/')
      })
    cy.get('[data-automation-id="discovery-home-invite-coordinator-button"]').should('not.exist')
  })

  it('renders Invite Coordinator on Home for customer login', () => {
    cy.intercept('GET', '**/discovery/api/cards', []).as('getHome')
    cy.login(['customer'])
    cy.visitPrefixed('/discovery/')
    cy.wait('@getHome')

    cy.get('[data-automation-id="discovery-home-invite-coordinator-button"]')
      .should('be.visible')
      .and(($btn) => {
        assertJourneyCreateHref($btn.attr('href'), '/customer/coordinators/')
      })
    cy.get('[data-automation-id="discovery-home-invite-member-button"]').should('not.exist')
  })

  it('renders both invite buttons on Home when login has both coordinator and customer roles', () => {
    cy.intercept('GET', '**/discovery/api/cards', []).as('getHome')
    cy.login(['coordinator', 'customer'])
    cy.visitPrefixed('/discovery/')
    cy.wait('@getHome')

    cy.get('[data-automation-id="discovery-home-invite-member-button"]').should('be.visible')
    cy.get('[data-automation-id="discovery-home-invite-coordinator-button"]').should('be.visible')
  })

  it('omits invite buttons on Home for mentor-only login', () => {
    cy.intercept('GET', '**/discovery/api/cards', []).as('getHome')
    cy.login(['mentor'])
    cy.visitPrefixed('/discovery/')
    cy.wait('@getHome')

    cy.get('[data-automation-id="discovery-home-invite-member-button"]').should('not.exist')
    cy.get('[data-automation-id="discovery-home-invite-coordinator-button"]').should('not.exist')
  })

  it('renders role-gated New buttons on resources, paths, and plans for mentor login', () => {
    cy.login(['mentor'])

    const collectionRoutes = [
      {
        source: 'resources',
        path: '/discovery/resources',
        btnId: 'discovery-resources-new-button',
        expectedPathname: '/mentor/resources/',
      },
      {
        source: 'paths',
        path: '/discovery/paths',
        btnId: 'discovery-paths-new-button',
        expectedPathname: '/mentor/paths/',
      },
      {
        source: 'plans',
        path: '/discovery/plans',
        btnId: 'discovery-plans-new-button',
        expectedPathname: '/mentor/plans/',
      },
    ]

    collectionRoutes.forEach(({ source, path, btnId, expectedPathname }) => {
      cy.intercept('GET', `**/discovery/api/cards/${source}*`, []).as(`get${source}`)
      cy.visitPrefixed(path)
      cy.wait(`@get${source}`)

      cy.get(`[data-automation-id="${btnId}"]`)
        .should('be.visible')
        .and(($btn) => {
          assertJourneyCreateHref($btn.attr('href'), expectedPathname)
        })
    })
  })

  it('omits New buttons on resources, paths, and plans for non-mentor login', () => {
    cy.login(['mentee'])
    const collectionRoutes = [
      { source: 'resources', path: '/discovery/resources', btnId: 'discovery-resources-new-button' },
      { source: 'paths', path: '/discovery/paths', btnId: 'discovery-paths-new-button' },
      { source: 'plans', path: '/discovery/plans', btnId: 'discovery-plans-new-button' },
    ]

    collectionRoutes.forEach(({ source, path, btnId }) => {
      cy.intercept('GET', `**/discovery/api/cards/${source}*`, []).as(`get${source}Mentee`)
      cy.visitPrefixed(path)
      cy.wait(`@get${source}Mentee`)
      cy.get(`[data-automation-id="${btnId}"]`).should('not.exist')
    })
  })

  it('omits New and Invite buttons on members, products, and notifications', () => {
    cy.login(['mentor', 'coordinator', 'customer'])
    const otherRoutes = [
      { source: 'members', path: '/discovery/members/' },
      { source: 'products', path: '/discovery/products' },
      { source: 'notifications', path: '/discovery/notifications' },
    ]

    otherRoutes.forEach(({ source, path }) => {
      cy.intercept('GET', `**/discovery/api/cards/${source}*`, []).as(`get${source}Other`)
      cy.visitPrefixed(path)
      cy.wait(`@get${source}Other`)
      cy.get(`[data-automation-id="discovery-${source}-new-button"]`).should('not.exist')
      cy.get(`[data-automation-id="discovery-${source}-invite-member-button"]`).should('not.exist')
      cy.get(`[data-automation-id="discovery-${source}-invite-coordinator-button"]`).should('not.exist')
    })
  })
})
