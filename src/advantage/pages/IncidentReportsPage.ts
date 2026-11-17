import { Locator, Page, Response } from "@playwright/test";
import IncidentReportsConstants from "@uiConstants/IncidentReportsConstants";

/**
 * Login form, navigation panel and Incident reports listing of the TenForce application.
 *
 * The listing grid is not a <table>: each row is an `li.item` holding a `ul.columns`,
 * and every cell carries a stable `data-ft-column-label` attribute, which is used here
 * instead of the generated `anonymous_element_*` ids.
 */
export default class IncidentReportsPage {
    readonly userNameTextbox: Locator;
    readonly passwordTextbox: Locator;
    readonly signInButton: Locator;

    readonly navigationMenuButton: Locator;
    readonly incidentManagementWorkspaceLink: Locator;
    readonly incidentReportsTile: Locator;
    readonly pageHeading: Locator;

    readonly titleFilterInput: Locator;
    readonly noResultsMessage: Locator;

    /*
     * Create new incident form.
     * @author vishal.bhut
     */
    readonly createNewItemLink: Locator;
    readonly createItemDialogHeading: Locator;
    readonly titleInput: Locator;
    readonly descriptionTextarea: Locator;
    readonly locationEditSelectionLink: Locator;
    readonly selectedLocation: Locator;
    readonly confirmSelectionButton: Locator;
    readonly recentlyCreatedHeading: Locator;

    // Used only by this page's own methods.
    private readonly filterToggleButton: Locator;
    private readonly filterRow: Locator;
    private readonly applyFilterButton: Locator;
    private readonly applyFilterSpinner: Locator;
    private readonly titleCells: Locator;
    private readonly dateOfOccurrenceField: Locator;
    private readonly selectionDialog: Locator;
    private readonly recentlyCreatedSection: Locator;
    private readonly createButton: Locator;
    private readonly cancelLink: Locator;
    // Listing reload started by creating an item; awaited when the create form is closed.
    private listingReload?: Promise<Response>;

    constructor(private readonly page: Page) {
        this.userNameTextbox = page.getByRole("textbox", { name: IncidentReportsConstants.USER_NAME_TEXTBOX_NAME });
        this.passwordTextbox = page.getByRole("textbox", { name: IncidentReportsConstants.PASSWORD_TEXTBOX_NAME });
        this.signInButton = page.getByRole("button", { name: IncidentReportsConstants.SIGN_IN_BUTTON_NAME });

        this.navigationMenuButton = page.locator("#showNavigationMenuButton");
        this.incidentManagementWorkspaceLink = page.getByRole("link", {
            name: IncidentReportsConstants.INCIDENT_MANAGEMENT_WORKSPACE,
            exact: true,
        });
        // Anchored at the end so "Incident reports assigned to me" is not matched.
        this.incidentReportsTile = page.getByRole("link", { name: IncidentReportsConstants.INCIDENT_REPORTS_TILE });
        this.pageHeading = page.getByText(IncidentReportsConstants.INCIDENT_REPORTS_PAGE_TITLE, { exact: true });

        this.filterToggleButton = page.locator("#datalist_filter_button");
        this.filterRow = page.locator("table.filtermode");
        this.titleFilterInput = this.filterRow.locator(
            `td[data-ft-column-label='${IncidentReportsConstants.TITLE_COLUMN}'] input`,
        );
        // Funnel icon at the end of the filter row.
        this.applyFilterButton = this.filterRow.locator("a.search");
        // Replaces the funnel icon while the grid reloads and is removed once the rows are rendered.
        this.applyFilterSpinner = this.filterRow.locator(".genericspinner");
        this.titleCells = page.locator(
            `li.item li[data-ft-column-label='${IncidentReportsConstants.TITLE_COLUMN}'] .cell`,
        );
        // Scoped to the listing: a hidden "No results found" template also exists in another view.
        this.noResultsMessage = page.locator("ul.itembox")
            .getByText(IncidentReportsConstants.NO_RESULTS_MESSAGE, { exact: true });

        // Create new incident form (author: vishal.bhut). The generated ids differ per page load,
        // so fields are located through their stable data-ft-field-label attribute.
        this.createNewItemLink = page.locator("#cni");
        this.createItemDialogHeading = page.getByRole("heading", {
            name: IncidentReportsConstants.CREATE_ITEM_DIALOG_HEADING,
        });
        this.titleInput = this.formField(IncidentReportsConstants.TITLE_FIELD).locator("input");
        this.descriptionTextarea = this.formField(IncidentReportsConstants.DESCRIPTION_FIELD).locator("textarea");
        this.dateOfOccurrenceField = this.formField(IncidentReportsConstants.DATE_OF_OCCURRENCE_FIELD);
        // Matched by text: the link's markup and classes change after a selection is confirmed.
        this.locationEditSelectionLink = this.formField(IncidentReportsConstants.LOCATION_FIELD)
            .getByText(IncidentReportsConstants.EDIT_SELECTION_LINK, { exact: true });
        this.selectedLocation = this.formField(IncidentReportsConstants.LOCATION_FIELD).locator(".multiselected");
        // "Select" overlay opened by Edit selection.
        this.selectionDialog = page.locator("div.multilevelselect");
        this.confirmSelectionButton = this.selectionDialog
            .getByText(IncidentReportsConstants.CONFIRM_SELECTION_BUTTON, { exact: true });
        this.createButton = page.locator("#cni_commit");
        this.cancelLink = page.locator("p.hasbuttons:has(#cni_commit) a.cancel");
        // After Create the form stays open, is cleared, and lists the new item under this section.
        this.recentlyCreatedSection = page.locator("#recentcni");
        this.recentlyCreatedHeading = this.recentlyCreatedSection.getByRole("heading", {
            name: IncidentReportsConstants.RECENTLY_CREATED_HEADING,
        });
    }

    /**
     * Clicks Create. Saving the item makes the listing behind the form reload, so listening
     * for that reload starts before the click.
     * @author vishal.bhut
     */
    async createItem() {
        this.listingReload = this.page.waitForResponse(
            (response) => response.url().endsWith(IncidentReportsConstants.LISTING_RELOAD_ENDPOINT) && response.ok(),
        );
        await this.createButton.click();
    }

    /**
     * Clicks cancel to close the create form, then waits until the listing has finished
     * reloading. Otherwise the reload re-renders the filter row and wipes any filter typed in.
     * @author vishal.bhut
     */
    async closeCreateForm() {
        await this.cancelLink.click();
        await this.createItemDialogHeading.waitFor({ state: "hidden" });
        if (this.listingReload) {
            await this.listingReload;
            this.listingReload = undefined;
        }
        await this.applyFilterSpinner.waitFor({ state: "hidden" });
    }

    /**
     * Links in the "Your recently created items" section that exactly match the given title.
     * @author vishal.bhut
     */
    recentlyCreatedItems(title: string): Locator {
        return this.recentlyCreatedSection.getByRole("link", { name: title, exact: true });
    }

    /**
     * Value container of a create-form field, identified by its label.
     * @author vishal.bhut
     */
    private formField(label: string): Locator {
        return this.page.locator(`div.value[data-ft-field-label='${label}']`);
    }

    /**
     * Toggle button of the Type field, for example "Incident" or "Near miss".
     * @author vishal.bhut
     */
    typeOption(type: string): Locator {
        return this.formField(IncidentReportsConstants.TYPE_FIELD).getByText(type, { exact: true });
    }

    /**
     * Picks a date in the Date of occurrence calendar. The calendar opens on the current
     * month, so it is moved month by month to the requested one before the day is clicked.
     * @param date - date to select
     * @author vishal.bhut
     */
    async selectDateOfOccurrence(date: Date) {
        await this.dateOfOccurrenceField.locator("input.text").click();

        const shownMonth = await this.dateOfOccurrenceField.locator("th#month").innerText();
        const shownYear = await this.dateOfOccurrenceField.locator("th#year").innerText();
        const shown = new Date(`${shownMonth.trim()} 1, ${shownYear.trim()}`);
        const monthsToMove = (date.getFullYear() - shown.getFullYear()) * 12 + (date.getMonth() - shown.getMonth());
        const monthArrow = this.dateOfOccurrenceField
            .locator(`tr:has(> th#month) th.${monthsToMove > 0 ? "next" : "prev"} a`);
        for (let move = 0; move < Math.abs(monthsToMove); move++) {
            await monthArrow.click();
        }

        // Calendar cells carry the date as MM/dd/yyyy.
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        await this.dateOfOccurrenceField.locator(`td[date='${month}/${day}/${date.getFullYear()}'] a`).click();
    }

    /**
     * Ticks the checkbox of the row whose Title is the given value in the "Select" overlay.
     * @param title - Title column value of the row to select, for example "Cafeteria"
     * @author vishal.bhut
     */
    async selectRowInSelectionDialog(title: string) {
        const row = this.selectionDialog.locator("li.item").filter({
            has: this.page.locator(`li[data-ft-column-label='${IncidentReportsConstants.TITLE_COLUMN}']`)
                .getByText(title, { exact: true }),
        });
        // The real checkbox input is transparent; its styled wrapper receives the click.
        await row.locator("div.checker").click();
    }

    /**
     * Title cells of the listing that exactly match the given title.
     * @author vishal.bhut
     */
    titleCellsWithText(title: string): Locator {
        return this.titleCells.getByText(title, { exact: true });
    }

    /**
     * Shows the inline filter row. The grid remembers the row's visibility per user
     * across sessions, so it is only toggled when currently hidden.
     */
    async openFilterRow() {
        if (!(await this.filterRow.isVisible())) {
            await this.filterToggleButton.click();
        }
    }

    /**
     * Clicks the funnel icon and waits for the grid to reload with the filtered data.
     * The rows are rendered after the filter response arrives, so the loading spinner
     * must also be gone before the grid is read.
     */
    async applyFilter() {
        await Promise.all([
            this.page.waitForResponse(
                (response) => response.url().includes(IncidentReportsConstants.APPLY_FILTER_ENDPOINT)
                    && response.ok(),
            ),
            this.applyFilterButton.click(),
        ]);
        await this.applyFilterSpinner.waitFor({ state: "hidden" });
    }

    /**
     * Returns the trimmed text of every Title cell currently listed in the grid.
     */
    async getTitleColumnValues(): Promise<string[]> {
        const titles = await this.titleCells.allInnerTexts();
        return titles.map((title) => title.trim());
    }
}
