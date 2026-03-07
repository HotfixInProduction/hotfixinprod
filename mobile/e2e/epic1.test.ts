import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, zoomIn, openBuildingSelector, selectCampus, searchAndSelectBuilding, wait, dismissAlert } from './helpers';

describe('US-1 Campus Map exploration', () => {

    it('AT-1.1-1.3 View SGW and Loyola Campus Maps', async () => {
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

    it('AT 1.4.1: Denied location permission displays a message or handles fallback gracefully', async () => {
        await setupApp({ location: 'never' });
        await navigateToMap();
        await dismissAlert('OK');

        // Verify the location-off button is visible
        await waitFor(element(by.id('location-off-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('location-off-button'))).toBeVisible();
    });

    it('AT 1.4.2: Granted location permission shows user location and highlights current building', async () => {
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();

        // The id for Hall Building in buildings.js is 'Hall Building'
        await waitFor(element(by.id('building-polygon-Hall Building-highlighted'))).toExist().withTimeout(15000);
    });

    it('AT 1.4.3: Moving to a different building updates the highlight correctly', async () => {
        const EVCoords = { latitude: 45.495622, longitude: -73.578121 };
        await setupApp({ location: 'always' }, EVCoords);
        await navigateToMap();

        // Verify the EV building is highlighted
        const evHighlightId = 'building-polygon-Engineering, Computer Science and Visual Arts Integrated Complex (EV Building)-highlighted';
        await waitFor(element(by.id(evHighlightId))).toExist().withTimeout(20000);

        // Verify that the Hall Building is NOT highlighted
        await expect(element(by.id('building-polygon-Hall Building-highlighted'))).not.toExist();
    });

    it('AT 1.5: Should tap on a building and show/close the info popup', async () => {
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
