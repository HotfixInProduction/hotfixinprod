import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, wait } from './helpers';

describe('Epic 5: Outdoor Point of Interests (Revised Flow)', () => {

    beforeEach(async () => {
        // Start near Hall Building (SGW Campus)
        // Restart app before each test for a fresh state
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
    });

    it('AT 5.1: should open POI via Nearest Banner and toggle Cafe filter', async () => {
        await navigateToMap();
        await wait(5000);

        // 1. Click on the Nearest POI banner via text
        console.log('Tapping "Nearest POI" text...');
        await element(by.text('Nearest POI')).atIndex(0).tap();

        // 2. Verify and exit out of the POI info panel
        console.log('Verifying POI panel and closing it...');
        await waitFor(element(by.id('poi-info-panel'))).toBeVisible().withTimeout(5000);
        await element(by.id('poi-close-button')).atIndex(0).tap();
        await waitFor(element(by.id('poi-info-panel'))).not.toBeVisible().withTimeout(3000);

        // 3. Click on the filter button
        console.log('Opening POI filter...');
        await element(by.id('poi-filter-toggle')).tap();

        // 4. Unselect the "Cafe" category
        console.log('Toggling "Café" category via text...');
        await element(by.text('Café')).atIndex(0).tap();

        // 5. Apply filters
        console.log('Applying filters...');
        await element(by.id('poi-apply-filter')).tap();
        await wait(2000);

        // 6. Navigate to Settings tab
        console.log('Navigating to Settings tab...');
        await element(by.id('tab-settings')).tap();
        await expect(element(by.id('poi-range-slider'))).toBeVisible();

        // Slide the range all the way down to 100
        console.log('Sliding POI range to minimum (100)...');
        // Start swipe at approx 500m thumb position (0.25 normalized)
        await element(by.id('poi-range-slider')).swipe('left', 'fast', 1.0, 0.25);
        await expect(element(by.id('poi-range-value'))).toHaveText('100 meters');

        // 7. Return to Map tab
        console.log('Returning to Map tab...');
        await element(by.id('tab-map')).tap();
        await wait(2000);
    });

    it('AT 5.2: should navigate to a Loyola POI and view directions', async () => {
        await navigateToMap();
        await wait(3000);

        // 1. Click on the Nearest POI banner via text
        console.log('Tapping "Nearest POI" text...');
        await element(by.text('Nearest POI')).atIndex(0).tap();

        console.log('Setting as destination...');
        await element(by.id('poi-set-destination-button')).tap();
        await wait(3000); // Wait for route calculation

        // 4. Click Start
        console.log('Tapping Start...');
        await element(by.text('Start')).tap();
        await waitFor(element(by.text('Directions'))).toBeVisible().withTimeout(5000);

        // 5. Exit navigation via X button
        console.log('Exiting navigation via X button...');
        await element(by.id('close-button')).tap();
        await expect(element(by.text('Directions'))).not.toBeVisible();
    });
});
