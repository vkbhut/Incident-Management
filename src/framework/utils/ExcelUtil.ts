import excelToJson from "convert-excel-to-json";
import ExcelConstants from "../constants/ExcelConstants";

/** One row of a test data sheet, keyed by the column headers. */
export type TestDataRow = Record<string, string>;

export default class ExcelUtil {
    /**
     * Returns every row of the given test data sheet.
     */
    public static getTestDataArray(sheet: string): TestDataRow[] {
        const result = excelToJson({
            sourceFile: ExcelConstants.TEST_PATH,
            columnToKey: {
                '*': '{{columnHeader}}',
            },
            sheetStubs: true,
            header: { rows: 1 },
            sheets: [sheet],
        });
        return result[sheet] as TestDataRow[];
    }

    /**
     * Returns the row whose TestID column matches the given test ID.
     */
    public static getTestData(sheet: string, testID: string): TestDataRow {
        const data = this.getTestDataArray(sheet).find((row) => row.TestID === testID);
        if (!data) {
            throw new Error(`Test '${testID}' was not found on '${sheet}' sheet`);
        }
        return data;
    }
}
