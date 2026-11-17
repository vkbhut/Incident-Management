import test, { Page } from "@playwright/test";
import Assert from "@asserts/Assert";
import IncidentReportsPage from "@pages/IncidentReportsPage";
import IncidentReportsConstants from "@uiConstants/IncidentReportsConstants";

/**
 * Details entered in the create new incident form.
 * @author vishal.bhut
 */
export interface IncidentDetails {
    title: string;
    type: string;
    description: string;
}

export default class IncidentReportsSteps {
    private readonly incidentReports: IncidentReportsPage;

    constructor(private readonly page: Page) {
        this.incidentReports = new IncidentReportsPage(page);
    }

    /**
     * Open the profile page. Cookies are cleared first because the spec suite shares
     * one browser page, and the app's "keep me logged in" cookie would otherwise skip
     * the login form.
     */
    public async navigateToProfilePage() {
        await test.step(`Navigate to ${IncidentReportsConstants.PROFILE_PATH}`, async () => {
            await this.page.context().clearCookies();
            await this.page.goto(`${process.env.INCIDENT_REPORTS_BASE_URL}${IncidentReportsConstants.PROFILE_PATH}`);
        });
    }

    /**
     * Sign in and wait until the app redirects back to the profile page.
     */
    public async login(userName: string, password: string) {
        await test.step(`Login as '${userName}' with the provided password`, async () => {
            await this.incidentReports.userNameTextbox.fill(userName);
            await this.incidentReports.passwordTextbox.fill(password);
            await this.incidentReports.signInButton.click();
            await this.page.waitForURL(IncidentReportsConstants.PROFILE_URL_PATTERN);
            await Assert.assertToBeHidden(this.incidentReports.signInButton,
                IncidentReportsConstants.SIGN_IN_BUTTON_AFTER_LOGIN);
        });
    }

    /**
     * Open the Incident reports listing through the navigation panel.
     */
    public async navigateToIncidentReports() {
        await test.step(`Navigate to the INCIDENT REPORTS section`, async () => {
            await this.incidentReports.navigationMenuButton.click();
            await this.incidentReports.incidentManagementWorkspaceLink.click();
            await this.incidentReports.incidentReportsTile.click();
            // The listing renders client-side after navigation; wait for it before asserting.
            await this.incidentReports.pageHeading.waitFor();
            await Assert.assertToBeExistAndVisible(this.incidentReports.pageHeading,
                IncidentReportsConstants.INCIDENT_REPORTS_HEADING);
        });
    }

    /**
     * Clear any Title filter value saved from a previous session and apply the empty
     * filter, so the listing is reset before the new search text is entered.
     */
    public async resetTitleFilter() {
        await test.step(`Clear the existing Title filter and click the Funnel Filter icon to reset`, async () => {
            await this.incidentReports.openFilterRow();
            await this.incidentReports.titleFilterInput.clear();
            await this.incidentReports.applyFilter();
        });
    }

    /**
     * Enter the search text in the Title column filter.
     */
    public async searchByTitle(title: string) {
        await test.step(`Search for incidents using the title '${title}'`, async () => {
            await this.incidentReports.titleFilterInput.fill(title);
        });
    }

    /**
     * Click the funnel icon to apply the filter row.
     */
    public async applyFilter() {
        await test.step(`Click on the Funnel Filter icon`, async () => {
            await this.incidentReports.applyFilter();
        });
    }

    /**
     * Verify every listed Title contains the search text. The app's title filter is a
     * case-insensitive "contains" match, so the comparison is case-insensitive as well.
     * When nothing matches, the grid must show "No results found" and the outcome is
     * recorded in the report and the execution log.
     */
    public async verifyTitleColumnContainsOnly(title: string) {
        await test.step(`Verify the Title column lists only incidents containing '${title}'`, async () => {
            const titles = await this.incidentReports.getTitleColumnValues();

            if (titles.length === 0) {
                await Assert.assertToBeExistAndVisible(this.incidentReports.noResultsMessage,
                    IncidentReportsConstants.NO_RESULTS_LABEL);
                await this.reportResult(`No incident found with Title containing '${title}'.`);
                return;
            }

            const unrelatedTitles = titles.filter(
                (listedTitle) => !listedTitle.toLowerCase().includes(title.toLowerCase()),
            );
            await this.reportResult(`${titles.length} incident(s) listed for Title filter '${title}': `
                + `${titles.join(" | ")}. Titles not containing '${title}': ${unrelatedTitles.length}.`);
            await Assert.assertEqualsList(unrelatedTitles, [],
                `no unrelated incidents are listed (titles not containing '${title}': ${unrelatedTitles.length})`);
        });
    }

    /**
     * Open the create new incident form from the listing.
     * @author vishal.bhut
     */
    public async openCreateNewItemForm() {
        await test.step(`Click on the Create New Item link`, async () => {
            await this.incidentReports.createNewItemLink.click();
            await Assert.assertToBeVisible(this.incidentReports.createItemDialogHeading,
                IncidentReportsConstants.CREATE_DIALOG_LABEL);
        });
    }

    /**
     * Enter the Title, select the Type and enter the Description.
     * @param details - incident title, type and description
     * @author vishal.bhut
     */
    public async enterIncidentDetails(details: IncidentDetails) {
        await test.step(`Enter '${details.title}' in the Title field`, async () => {
            await this.incidentReports.titleInput.fill(details.title);
        });
        await test.step(`Select '${details.type}' as the Type`, async () => {
            await this.incidentReports.typeOption(details.type).click();
        });
        await test.step(`Enter '${details.description}' in the Description field`, async () => {
            await this.incidentReports.descriptionTextarea.fill(details.description);
        });
    }

    /**
     * Set the Date of Occurrence through the calendar picker to a date in the past.
     * The app rejects a date of occurrence in the future, and its server clock can be behind
     * the local one, so the date is calculated relative to today instead of being fixed.
     * @param daysBeforeToday - number of days before the current date, for example 2
     * @author vishal.bhut
     */
    public async setDateOfOccurrence(daysBeforeToday: number) {
        const date = new Date();
        date.setDate(date.getDate() - daysBeforeToday);
        const displayDate = date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

        await test.step(`Set the Date of Occurrence to '${displayDate}' (${daysBeforeToday} days before today)`,
            async () => {
                await this.incidentReports.selectDateOfOccurrence(date);
            });
    }

    /**
     * Select a location through the Location field's Edit Selection overlay.
     * @param location - Title of the location to select, for example "Cafeteria"
     * @author vishal.bhut
     */
    public async selectLocation(location: string) {
        await test.step(`Under the Location field, click on the Edit Selection link`, async () => {
            await this.incidentReports.locationEditSelectionLink.click();
        });
        await test.step(`Select the checkbox of '${location}' in the Title column`, async () => {
            await this.incidentReports.selectRowInSelectionDialog(location);
        });
        await test.step(`Click on the Confirm Selection button`, async () => {
            await this.incidentReports.confirmSelectionButton.click();
        });
    }

    /**
     * Verify the Location field shows the selected location.
     * @param location - expected location, for example "Cafeteria"
     * @author vishal.bhut
     */
    public async verifySelectedLocation(location: string) {
        await test.step(`Verify '${location}' is displayed in the Location field`, async () => {
            await Assert.assertToHaveText(this.incidentReports.selectedLocation, location,
                IncidentReportsConstants.LOCATION_FIELD_LABEL);
        });
    }

    /**
     * Click Create. The form stays open and is cleared so another item can be entered.
     * @author vishal.bhut
     */
    public async createIncident() {
        await test.step(`Click on the Create button`, async () => {
            await this.incidentReports.createItem();
        });
    }

    /**
     * Verify the created incident is listed under "Your recently created items" in the form.
     * @param title - title entered for the created incident
     * @author vishal.bhut
     */
    public async verifyRecentlyCreatedItem(title: string) {
        await test.step(`Verify '${title}' is listed under '${IncidentReportsConstants.RECENTLY_CREATED_HEADING}'`,
            async () => {
                // The section appears once the server has saved the item.
                await this.incidentReports.recentlyCreatedHeading.waitFor();
                await Assert.assertToBeVisible(this.incidentReports.recentlyCreatedHeading,
                    IncidentReportsConstants.RECENTLY_CREATED_LABEL);
                // Any matching link is enough if the same title was created more than once in this session.
                await Assert.assertToBeVisible(this.incidentReports.recentlyCreatedItems(title).first(),
                    `'${title}' in the ${IncidentReportsConstants.RECENTLY_CREATED_LABEL}`);
            });
    }

    /**
     * Click cancel to close the create form and return to the incident listing.
     * @author vishal.bhut
     */
    public async closeCreateForm() {
        await test.step(`Click on the cancel button`, async () => {
            await this.incidentReports.closeCreateForm();
            await Assert.assertToBeHidden(this.incidentReports.createItemDialogHeading,
                IncidentReportsConstants.CREATE_DIALOG_LABEL);
        });
    }

    /**
     * Verify an incident with the given title is shown in the incident listing.
     * @param title - title of the created incident
     * @author vishal.bhut
     */
    public async verifyIncidentListed(title: string) {
        await test.step(`Verify the created incident '${title}' appears in the incident listing`, async () => {
            // Earlier runs may have created incidents with the same title, so any matching row is enough.
            await Assert.assertToBeVisible(this.incidentReports.titleCellsWithText(title).first(),
                `incident '${title}' in the listing`);
        });
    }

    /**
     * Record the verification outcome as a test annotation and a report step. The step
     * title is written to the execution log by the TestListener reporter.
     */
    private async reportResult(message: string) {
        test.info().annotations.push({ type: IncidentReportsConstants.RESULT_ANNOTATION, description: message });
        await test.step(message, async () => { /* outcome-only step */ });
    }
}
