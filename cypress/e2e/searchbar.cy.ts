// import cy from 'cypress';

// describe('SearchBar E2E', () => {
//   beforeEach(() => {
//     cy.visit('http://localhost:5173');
//   });

//   it('shows suggestions after typing and selecting with keyboard', () => {
//     cy.get('input[aria-label="Search transactions"]')
//       .type('ama')
//       .wait(400); // simulate debounce delay

//     cy.get('[role="listbox"]')
//       .should('exist')
//       .within(() => {
//         cy.contains('amazon', { matchCase: false }).should('exist');
//       });

//     cy.get('input[aria-label="Search transactions"]').type('{downarrow}{enter}');

//     cy.get('input[aria-label="Search transactions"]').should('have.value', 'amazon');
//   });

//   it('clears input when X button is clicked', () => {
//     cy.get('input[aria-label="Search transactions"]').type('netflix');
//     cy.get('button[aria-label="Clear search"]').click();
//     cy.get('input[aria-label="Search transactions"]').should('have.value', '');
//   });
// });
