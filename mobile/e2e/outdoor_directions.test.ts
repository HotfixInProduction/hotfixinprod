import { element, by, expect, waitFor } from 'detox';
import { setupApp, navigateToMap, zoomIn, openBuildingSelector, selectCampus, searchAndSelectBuilding, wait } from './helpers';

describe('Outdoor Directions E2E Test', () => {

    it('Path A: should select start and destination via map clicks', async () => {
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();

        await wait(2000);
        await zoomIn(3.0);

        // Open building selector (directions panel)
        await openBuildingSelector();

        // Set Start via Map (Hall Building ID)
        await element(by.id('select-start-on-map')).tap();
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        console.log("Hall Building selected as start");

        // Toggle loyola
        await selectCampus('loyola');

        // Set Destination via Map (LB Building ID)
        await element(by.id('select-destination-on-map')).tap();
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        console.log("CJ Building selected as destination at loyola campus");

        // Verify markers
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
    });

    it('Path B: should select start via Current Location and destination via search', async () => {
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await setupApp({ location: 'always' }, hallCoords);
        await navigateToMap();

        // Open building selector
        await openBuildingSelector();

        // 1. Use Current Location (Start)
        await element(by.id('use-current-location-button')).tap();
        await waitFor(element(by.id('start-marker'))).toExist().withTimeout(10000);

        // 2. Search for Destination (Communications & Journalism Building)
        await wait(2000);
        await searchAndSelectBuilding('destination-building-selector', 'Communications & Journalism Building');

        // Verify markers appear
        await waitFor(element(by.id('destination-marker'))).toExist().withTimeout(20000);
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
    });

});
