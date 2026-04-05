import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, openBuildingSelector, searchAndSelectBuilding, wait, selectCampus, zoomIn } from './helpers';

describe('Epic 4: Indoor Floor Plans E2E Test', () => {

    it('AT 4.1-4.2: Should select Hall Building and view its floor plan same floor', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);

        // 2. Open building selector and search for Hall Building
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });

        // 3. Verify that the building info panel shows "View Floor Plan" button
        await waitFor(element(by.id('view-floor-plan-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('view-floor-plan-button'))).toBeVisible();

        // 4. Tap "View Floor Plan"
        await element(by.id('view-floor-plan-button')).tap();

        // 5. Verify the Floor Plan Viewer is displayed
        // We check for the title and the close button
        await waitFor(element(by.id('floor-plan-close'))).toBeVisible().withTimeout(15000);
        await expect(element(by.text('Hall Building - Floor 1'))).toBeVisible();

        // 6. Select Start Room
        await element(by.text('H829')).tap();
        await element(by.text('H--118-2')).tap();

        // 7. Select Destination Room
        await element(by.text('H862')).tap();
        await waitFor(element(by.id('cross-building-room-search'))).toBeVisible().withTimeout(5000);
        await element(by.id('cross-building-room-search')).typeText('H-2');
        await element(by.text('H-23')).tap();

    });

    it('AT 4.3: Should select Hall Building and view its floor plan different floor and display accessible route', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);

        // 2. Open building selector and search for Hall Building
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });

        // 3. Verify that the building info panel shows "View Floor Plan" button
        await waitFor(element(by.id('view-floor-plan-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('view-floor-plan-button'))).toBeVisible();

        // 4. Tap "View Floor Plan"
        await element(by.id('view-floor-plan-button')).tap();

        // 5. Verify the Floor Plan Viewer is displayed
        // We check for the title and the close button
        await waitFor(element(by.id('floor-plan-close'))).toBeVisible().withTimeout(15000);
        await expect(element(by.text('Hall Building - Floor 1'))).toBeVisible();

        // 6. Select Start Room
        await element(by.text('H829')).tap();
        await element(by.text('H--118-2')).tap();

        // 7. Select Destination Room
        await element(by.text('H862')).tap();
        await waitFor(element(by.id('cross-building-room-search'))).toBeVisible().withTimeout(5000);
        await element(by.id('cross-building-room-search')).typeText('H-2');
        await element(by.text('H-205')).tap();

        //8. Show both floors and click accessibility button
        await element(by.id('floor-btn-1')).tap();
        await element(by.id('floor-btn-2')).tap();
        await element(by.id('accessibility-toggle')).tap();
        await element(by.id('floor-btn-1')).tap();
        await element(by.id('floor-btn-2')).tap();
        await wait(2000);

    });

    it('AT 4.4: Should select Hall Building and view floor 8 and 9 for POI', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);

        // 2. Open building selector and search for Hall Building
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });

        // 3. Verify that the building info panel shows "View Floor Plan" button
        await waitFor(element(by.id('view-floor-plan-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('view-floor-plan-button'))).toBeVisible();

        // 4. Tap "View Floor Plan"
        await element(by.id('view-floor-plan-button')).tap();

        // 5. Verify the Floor Plan Viewer is displayed
        // We check for the title and the close button
        await waitFor(element(by.id('floor-plan-close'))).toBeVisible().withTimeout(15000);
        await expect(element(by.text('Hall Building - Floor 1'))).toBeVisible();


        // 6. Select Floor 9
        await element(by.id('floor-btn-9')).tap();
        await waitFor(element(by.text('Hall Building - Floor 9'))).toBeVisible().withTimeout(5000);

        // 7. Select Floor 8
        await element(by.id('floor-btn-8')).tap();
        await waitFor(element(by.text('Hall Building - Floor 8'))).toBeVisible().withTimeout(5000);

        // 8. Select POI (Stairs)
        await waitFor(element(by.id('amenity-touch-stairs1'))).toBeVisible().withTimeout(5000);
        await element(by.id('amenity-touch-stairs1')).tap();
        wait(5000);


    });

    it('AT 4.5: Should select Destination picker and view directions different floors', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);


        // 2. Open building selector and search for Hall Building
        await openBuildingSelector();
        await element(by.id('use-current-location-button')).tap();

    });

    it('AT 4.6: Should select Destination picker and view floor directions to different building floors', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);

        // 2. Open building selector and search for Hall Building


    });

});
