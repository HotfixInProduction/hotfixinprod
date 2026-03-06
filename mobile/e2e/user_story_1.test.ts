import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, selectCampus, wait } from './helpers';

describe('US-1 View SGW and Loyola Campus Maps', () => {

    it('should show SGW campus by default and allow switching to Loyola', async () => {
        await setupApp();
        await navigateToMap();

        // 1. Verify default state (SGW)
        await waitFor(element(by.text('Downtown'))).toBeVisible().withTimeout(5000);
        await expect(element(by.text('Downtown'))).toBeVisible();
        await expect(element(by.text('Loyola'))).toBeVisible();

        // 2. Switch to Loyola
        await wait(3000);
        console.log('Tapping Loyola button...');
        await selectCampus('loyola');

        // 3. Switch back to Downtown
        await wait(3000);
        console.log('Tapping Downtown button...');
        await selectCampus('downtown');
        await expect(element(by.id('campus-selector-downtown'))).toBeVisible();
    });
});
