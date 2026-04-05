import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, openBuildingSelector, searchAndSelectBuilding, searchAndSelectBuilding2, wait, selectCampus, zoomIn } from './helpers';

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


        // 2. Open building selector (room selection mode) and search for Hall Building
        await openBuildingSelector();
        await waitFor(element(by.id('room-selection-toggle'))).toExist().withTimeout(5000);
        await element(by.id('room-selection-toggle')).tap();
        await element(by.id('use-current-location-button')).tap();

        // 3. Select Start Room: Floor 1, H--118-2
        // Floor 1 is already selected by default for Hall Building
        await waitFor(element(by.text('Room: Select')).atIndex(0)).toBeVisible().withTimeout(5000);
        await element(by.text('Room: Select')).atIndex(0).tap();
        await waitFor(element(by.text('H-118-2'))).toBeVisible().withTimeout(5000);
        await element(by.text('H-118-2')).tap();

        // 4. Select Destination Building: Tap on map (Hall Building)
        await element(by.id('select-destination-on-map')).tap();
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        await wait(2000);

        // 5. Change Destination Floor to 8
        await element(by.text('Floor: 1')).atIndex(1).tap();
        await waitFor(element(by.text('Floor 8'))).toBeVisible().withTimeout(5000);
        await element(by.text('Floor 8')).tap();

        // 6. Select Destination Room: H-801
        await waitFor(element(by.text('Room: Select'))).toBeVisible().withTimeout(5000);
        await element(by.text('Room: Select')).tap();
        await waitFor(element(by.text('H801'))).toBeVisible().withTimeout(5000);
        await element(by.text('H801')).tap();

        // 7. View Directions
        await element(by.id('view-directions-button')).tap();

        // 8. Select Walk mode
        await waitFor(element(by.id('route-info-mode-walking'))).toExist().withTimeout(5000);
        await element(by.id('route-info-mode-walking')).tap();

        // 9. Tap Start
        await waitFor(element(by.id('confirm-route-button'))).toExist().withTimeout(2000);
        await element(by.id('confirm-route-button')).tap();

        // 10. Expand directions
        await waitFor(element(by.id('expand-directions-button'))).toExist().withTimeout(5000);
        await element(by.id('expand-directions-button')).tap();

        // 11. Scroll through directions
        await waitFor(element(by.id('next-instruction-button'))).toExist().withTimeout(5000);
        await element(by.id('next-instruction-button')).tap();

        // 12. Close directions
        await waitFor(element(by.id('close-button'))).toExist().withTimeout(2000);
        await element(by.id('close-button')).tap();

        await wait(2000);

    });

    it('AT 4.6: Should select Destination picker and view floor directions to different building floors', async () => {
        // 1. Setup app near Hall Building
        const hallCoords = { latitude: 45.497285, longitude: -73.578974 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();
        await wait(2000);
        await zoomIn(3.0);

        // 2. Open building selector (room selection mode) and search for Hall Building
        await openBuildingSelector();
        await waitFor(element(by.id('room-selection-toggle'))).toExist().withTimeout(5000);
        await element(by.id('room-selection-toggle')).tap();
        await element(by.id('use-current-location-button')).tap();

        // 3. Select Start Room: Floor 1, H--118-2
        // Floor 1 is already selected by default for Hall Building
        await waitFor(element(by.text('Room: Select')).atIndex(0)).toBeVisible().withTimeout(5000);
        await element(by.text('Room: Select')).atIndex(0).tap();
        await waitFor(element(by.text('H-118-2'))).toBeVisible().withTimeout(5000);
        await element(by.text('H-118-2')).tap();

        // 4. Select Destination Building: Tap on map (Hall Building)
        await searchAndSelectBuilding2('destination-building-selector', 'John Molson Building');
        await wait(2000);

        // 5. Select Destination Room: MB1.115
        await waitFor(element(by.text('Room: Select'))).toBeVisible().withTimeout(5000);
        await element(by.text('Room: Select')).tap();
        await waitFor(element(by.text('MB1.115'))).toBeVisible().withTimeout(5000);
        await element(by.text('MB1.115')).tap();

        // 6. View Directions
        await element(by.id('view-directions-button')).tap();

        // 7. Select Walk mode
        await waitFor(element(by.id('route-info-mode-walking'))).toExist().withTimeout(5000);
        await element(by.id('route-info-mode-walking')).tap();

        // 9. Tap Start
        await waitFor(element(by.id('confirm-route-button'))).toExist().withTimeout(2000);
        await element(by.id('confirm-route-button')).tap();

        // 10. Expand directions
        await waitFor(element(by.id('expand-directions-button'))).toExist().withTimeout(5000);
        await element(by.id('expand-directions-button')).tap();

        // 11. Scroll through directions
        await waitFor(element(by.id('next-instruction-button'))).toExist().withTimeout(5000);
        await element(by.id('next-instruction-button')).tap();
        await wait(2000);
        await element(by.id('next-instruction-button')).tap();

        // 12. Close directions
        await waitFor(element(by.id('close-button'))).toExist().withTimeout(2000);
        await element(by.id('close-button')).tap();

        await wait(2000);


    });


});
