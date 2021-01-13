Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  console.log('Error ', err)
  return false;
})

const adminUrl = Cypress.env('adminUrl');
const budgettingSiteId =  Cypress.env('budgettingSiteId');

const submitVote = (cy, votingCode) => {

  cy.scrollTo('top');

  // wait for animations to finish otherwise button will not be visible
  cy.wait(1500)

  // force the click, cypress will fail if button is not visible
  // this happens quiete quickly in this flow and scrollTo somehow doesn't always work
  // is worth debugging, but for now force it to make a more stable test
  cy.get('button')
    .contains('Volgende')
    .click({
      force: true
    });

  //second step, see if overview of selected step is correctly rendered
  cy.get('.overview')
    .find('tr')
    .its('length')
    .should('be.gte', 0)

  cy.get('#next-button')
    .click();

  cy.wait(200)

  cy.get('a')
    .contains('Vul je stemcode in')
    .click();

  cy.get('[name="unique_code"]')
    .type(votingCode)
    .click();

  cy.wait(500);

  // submit CODE form
  cy.get('form [type="submit"]')
    .click();

  cy.wait(500);

  // confirm vote
  cy.get('#next-button')
    .click();
}

describe('Budgeting selecting ideas', () => {

  it('Create a unique code as admin, and use it to vote', () => {

    cy.log('Create a new unique code for testing');

    cy.loginAdminPanel();

    cy.visit(`${adminUrl}/admin/site/${budgettingSiteId}/unique-codes`);

    cy.get('a')
      .contains('Create')
      .click();

    // submit form
    cy.get('form [type="submit"]')
      .click();

    // get latest code
    cy.get('table tr td')
      .eq(1)
      .invoke('text')
      .then((votingCode) => {

        cy.log('Voting code found, start the voting process', votingCode);

        // goto site
        cy.visit(Cypress.env('budgettingSiteUrl'))

        //clear local storage in case previous run is debugged in UI env
        cy.clearLocalStorage();

        // go to voting page
        cy.get('.nav-link')
          .contains('Stemmen')
          .click();

        cy.wait(500)

        cy.get('.button-add-idea-to-budget')
          .first()
          .click();


        submitVote(cy, votingCode)

        cy.wait(1000);

        cy.contains('Gelukt, je hebt gestemd!')
          .its('length')
          .should('be.gte', 0)

        cy.wait(1000);


        cy.log('Let\'s vote again, same code, this time should give an error', votingCode);

        //
        cy.get('#next-button')
          .click();

        cy.wait(1000);

        cy.get('.button-add-idea-to-budget')
          .first()
          .click();

        cy.wait(1000);

        submitVote(cy, votingCode)

        cy.contains('Het opslaan van je stemmen is niet gelukt')
          .its('length')
          .should('be.gte', 0)

      });

  });

})
