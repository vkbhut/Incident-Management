import { Locator } from "@playwright/test";
import { test, expect } from "@base-test";
import Logger from "framework/logger/Logger";

export default class Assert {
    /**
     * To verify that the actual list equals the expected list
     * @param actual - list read from the application
     * @param expected - expected list
     * @param description - description of what is being validated
     */
    public static async assertEqualsList(actual: unknown[], expected: unknown[], description: string) {
        await test.step(`Verifying that ${description}`, async () => {
            try {
                expect(actual, `Expected '${expected}' should be EQUAL to Actual '${actual}'`).toEqual(expected);
            } catch (error) {
                Logger.error(error);
                throw error;
            }
        });
    }

    /**
     * To validate that an element exists exactly once and is visible
     * @param locator - element to validate
     * @param description - description of the element
     * @author vishal.bhut
     */
    public static async assertToBeExistAndVisible(locator: Locator, description: string) {
        await test.step(`Verifying that ${description} is exists and visible`, async () => {
            try {
                await expect(locator, `Checking if ${description} exists or not`).toHaveCount(1);
                await expect(locator, `Checking if ${description} visible or not`).toBeVisible();
            } catch (error) {
                Logger.error(error);
                throw error;
            }
        });
    }

    /**
     * To validate that an element is visible
     * @param locator - element to validate
     * @param description - description of the element
     * @author vishal.bhut
     */
    public static async assertToBeVisible(locator: Locator, description: string) {
        await test.step(`Verifying that ${description} is visible`, async () => {
            try {
                await expect(locator, `Checking if ${description} visible or not`).toBeVisible();
            } catch (error) {
                Logger.error(error);
                throw error;
            }
        });
    }

    /**
     * To validate that an element has the expected text
     * @param locator - element to validate
     * @param value - expected text
     * @param description - description of the element
     * @author vishal.bhut
     */
    public static async assertToHaveText(locator: Locator, value: string, description: string) {
        await test.step(`Verifying that ${description} is having text value '${value}' or not`, async () => {
            try {
                await expect(locator, `Checking if ${description} is having text value '${value}' or not`)
                    .toHaveText(value);
            } catch (error) {
                Logger.error(error);
                throw error;
            }
        });
    }

    /**
     * To validate that an element is invisible or removed from the DOM
     * @param locator - element to validate
     * @param description - description of the element
     * @author vishal.bhut
     */
    public static async assertToBeHidden(locator: Locator, description: string) {
        await test.step(`Verifying that ${description} is invisible or not`, async () => {
            try {
                await expect(locator, `Checking if ${description} invisible or not`).toBeHidden();
            } catch (error) {
                Logger.error(error);
                throw error;
            }
        });
    }
}
