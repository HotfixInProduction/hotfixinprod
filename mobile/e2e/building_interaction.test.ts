import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, zoomIn, wait } from './helpers';

describe('Building Interaction E2E Test', () => {

    it('should tap on a building and show/close the info popup', async () => {
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();

        await wait(3000);
        await zoomIn(3.0);

        // Tap on building
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });

        // Verify the building info popup appears
        await waitFor(element(by.id('building-title'))).toExist().withTimeout(10000);
        await expect(element(by.id('building-title'))).toHaveText('Hall Building');

        // Close the popup
        await element(by.id('building-close')).tap();

        // Verify the popup is gone
        await waitFor(element(by.id('building-title'))).not.toExist().withTimeout(5000);
    });

});
