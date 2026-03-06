import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, dismissAlert } from './helpers';

describe('US-1 Location Permissions and Building Highlight Maps', () => {

    it('Scenario 1: Denied location permission displays a message or handles fallback gracefully', async () => {
        await setupApp({ location: 'never' });
        await navigateToMap();
        await dismissAlert('OK');

        // Verify the location-off button is visible
        await waitFor(element(by.id('location-off-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('location-off-button'))).toBeVisible();
    });

    it('Scenario 2: Granted location permission shows user location and highlights current building', async () => {
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();

        // The id for Hall Building in buildings.js is 'Hall Building'
        await waitFor(element(by.id('building-polygon-Hall Building-highlighted'))).toExist().withTimeout(15000);
    });

    it('Scenario 3: Moving to a different building updates the highlight correctly', async () => {
        const EVCoords = { latitude: 45.495622, longitude: -73.578121 };
        await setupApp({ location: 'always' }, EVCoords);
        await navigateToMap();

        // Verify the EV building is highlighted
        const evHighlightId = 'building-polygon-Engineering, Computer Science and Visual Arts Integrated Complex (EV Building)-highlighted';
        await waitFor(element(by.id(evHighlightId))).toExist().withTimeout(20000);

        // Verify that the Hall Building is NOT highlighted
        await expect(element(by.id('building-polygon-Hall Building-highlighted'))).not.toExist();
    });

});
