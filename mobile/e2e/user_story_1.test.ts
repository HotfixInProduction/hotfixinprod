import { device, element, by, expect, waitFor } from 'detox';

describe('US-1 View SGW and Loyola Campus Maps', () => {


    it('should show SGW campus by default and allow switching to Loyola', async () => {

        // Ensure Map Tab is selected
        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();

        // 1. Verify default state (SGW)
        await waitFor(element(by.text('Downtown'))).toBeVisible().withTimeout(5000);
        await expect(element(by.text('Downtown'))).toBeVisible();
        await expect(element(by.text('Loyola'))).toBeVisible();

        // 2. Switch to Loyola
        await new Promise(r => setTimeout(r, 3000));
        console.log('Tapping Loyola button...');
        await element(by.id('campus-selector-loyola')).tap();

        // 3. Switch back to Downtown
        await new Promise(r => setTimeout(r, 3000));
        console.log('Tapping Downtown button...');
        await element(by.id('campus-selector-downtown')).tap();
        await expect(element(by.id('campus-selector-downtown'))).toBeVisible();
    });
});
