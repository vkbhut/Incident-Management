import { test } from "@base-test";
import ExcelUtil from "@utils/ExcelUtil";
import IncidentReportsSteps from "@uiSteps/IncidentReportsSteps";
import IncidentReportsConstants from "@uiConstants/IncidentReportsConstants";

export const SHEET = IncidentReportsConstants.SHEET;
export const UserName = process.env.INCIDENT_REPORTS_USERNAME as string;
export const Password = process.env.INCIDENT_REPORTS_PASSWORD as string;

let incidentReports: IncidentReportsSteps;

test.beforeEach(async ({ page }) => {
  incidentReports = new IncidentReportsSteps(page);
});

test.describe("IncidentReports", async () => {
  // The Title filter is saved per user on the server, so these tests must not run in parallel.
  test.describe.configure({ mode: "serial" });

  /**
   * @testID TC01_Verify_Incident_Report_Filtering_By_Title
   * @description Verify that filtering by Title lists only incidents whose Title contains the search text
   * @author vishal.bhut
   */
  const data1 = ExcelUtil.getTestData(
    SHEET,
    "TC01_Verify_Incident_Report_Filtering_By_Title",
  );

  test(
    `${data1.Description}`,
    { tag: ["@regression", "@sanity"] },
    async ({ allure }) => {
      await allure.attachDetails(data1.Description);
      await allure.addEpic("IncidentReports");
      await allure.addStory("TC01_Verify_Incident_Report_Filtering_By_Title");
      await allure.addFeature(`${data1.TestID} - ${data1.Description}`);

      await incidentReports.navigateToProfilePage();
      await incidentReports.login(UserName, Password);
      await incidentReports.navigateToIncidentReports();

      await incidentReports.resetTitleFilter();
      await incidentReports.searchByTitle(data1.SearchTitle);
      await incidentReports.applyFilter();

      await incidentReports.verifyTitleColumnContainsOnly(data1.SearchTitle);
    },
  );

  /**
   * @testID TC02_Create_Incident_With_Location_And_Verify_Title_Filtering
   * @description Create an incident with a specific location, verify it is listed, and verify
   * that filtering by its title lists only incidents whose Title contains that text
   * @author vishal.bhut
   */
  const data2 = ExcelUtil.getTestData(
    SHEET,
    "TC02_Create_Incident_With_Location_And_Verify_Title_Filtering",
  );

  test(
    `${data2.Description}`,
    { tag: ["@regression", "@sanity"] },
    async ({ allure }) => {
      await allure.attachDetails(data2.Description);
      await allure.addEpic("IncidentReports");
      await allure.addStory("TC02_Create_Incident_With_Location_And_Verify_Title_Filtering");
      await allure.addFeature(`${data2.TestID} - ${data2.Description}`);

      await incidentReports.navigateToProfilePage();
      await incidentReports.login(UserName, Password);
      await incidentReports.navigateToIncidentReports();

      // Create the incident with the Cafeteria location.
      await incidentReports.openCreateNewItemForm();
      await incidentReports.enterIncidentDetails({
        title: data2.IncidentTitle,
        type: data2.IncidentType,
        description: data2.IncidentDescription,
      });
      await incidentReports.setDateOfOccurrence(Number(data2.DateOfOccurrenceDaysBeforeToday));
      await incidentReports.selectLocation(data2.Location);
      await incidentReports.verifySelectedLocation(data2.Location);
      await incidentReports.createIncident();
      await incidentReports.verifyRecentlyCreatedItem(data2.IncidentTitle);
      await incidentReports.closeCreateForm();

      // Clear the Title filter (funnel click resets the listing), then filter by the created title.
      await incidentReports.resetTitleFilter();
      await incidentReports.searchByTitle(data2.SearchTitle);
      await incidentReports.applyFilter();
      await incidentReports.verifyTitleColumnContainsOnly(data2.SearchTitle);
      await incidentReports.verifyIncidentListed(data2.IncidentTitle);
    },
  );
});
