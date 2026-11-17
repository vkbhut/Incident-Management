export default class IncidentReportsConstants {
    static readonly SHEET = "IncidentReports";

    // Routes (relative to INCIDENT_REPORTS_BASE_URL).
    static readonly PROFILE_PATH = "/account/profile";
    static readonly PROFILE_URL_PATTERN = /\/account\/profile/;

    // Accessible names of the login form controls.
    static readonly USER_NAME_TEXTBOX_NAME = "Enter your username or email";
    static readonly PASSWORD_TEXTBOX_NAME = "Enter your password";
    static readonly SIGN_IN_BUTTON_NAME = "Sign In";

    // Navigation panel workspace and the listing tile inside it.
    static readonly INCIDENT_MANAGEMENT_WORKSPACE = "Incident Management - Leuven";
    // The tile's accessible name is prefixed by an icon-font glyph, so it is matched at the end only.
    static readonly INCIDENT_REPORTS_TILE = /Incident reports$/;
    static readonly INCIDENT_REPORTS_PAGE_TITLE = "Incident reports";

    // Grid column label (data-ft-column-label) and messages.
    static readonly TITLE_COLUMN = "Title";
    static readonly NO_RESULTS_MESSAGE = "No results found";

    // Ajax endpoint the grid calls when the funnel filter is applied.
    static readonly APPLY_FILTER_ENDPOINT = "GetItemBoxDataApplyFilter";
    // Ajax endpoint the grid calls to reload itself after a new item is created (author: vishal.bhut).
    static readonly LISTING_RELOAD_ENDPOINT = "/GetItemBoxData";

    // Annotation type shown in the HTML report for the verification outcome.
    static readonly RESULT_ANNOTATION = "Title filter result";

    // Element descriptions used in assertions and reports.
    static readonly SIGN_IN_BUTTON_AFTER_LOGIN = "Sign In button after a successful sign in";
    static readonly INCIDENT_REPORTS_HEADING = "Incident reports page heading";
    static readonly NO_RESULTS_LABEL = "Incident listing 'No results found' message";

    /*
     * Create new incident form.
     * @author vishal.bhut
     */
    static readonly CREATE_ITEM_DIALOG_HEADING = "Create new 'Incident reports' item";
    // Form field labels (data-ft-field-label attribute of each field's value container).
    static readonly TITLE_FIELD = "Title";
    static readonly TYPE_FIELD = "Type";
    static readonly DESCRIPTION_FIELD = "Description";
    static readonly DATE_OF_OCCURRENCE_FIELD = "Date of occurrence";
    static readonly LOCATION_FIELD = "Location";
    static readonly EDIT_SELECTION_LINK = "Edit selection";
    static readonly CONFIRM_SELECTION_BUTTON = "Confirm selection";
    static readonly RECENTLY_CREATED_HEADING = "Your recently created items";
    static readonly CREATE_DIALOG_LABEL = "Create new incident form";
    static readonly LOCATION_FIELD_LABEL = "Selected location in the Location field";
    static readonly RECENTLY_CREATED_LABEL = "'Your recently created items' section";
}
