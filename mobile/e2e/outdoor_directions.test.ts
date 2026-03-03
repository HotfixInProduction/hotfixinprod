import { device, element, by, expect, waitFor } from 'detox';

describe('Outdoor Directions E2E Test', () => {

    it('Path A: should select start and destination via map clicks', async () => {
        await device.disableSynchronization();

        //Force start at Hall building
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await device.setLocation(hallCoords.latitude, hallCoords.longitude);

        await device.launchApp({
            newInstance: true,
            permissions: { location: 'always' },
        });

        // Navigate to the Map screen
        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();
        console.log("Map screen opened");

        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log("Map screen fully loaded");

        // Increase pinch magnitude to ensure we are zoomed in enough
        await element(by.id('map')).atIndex(0).pinch(3.0, 'slow', 0);
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Map zoomed in');

        // Open building selector (directions panel)
        await element(by.id('building-selector-toggle')).tap();
        await waitFor(element(by.id('select-start-on-map'))).toBeVisible().withTimeout(5000);
        console.log("Building selector opened");

        // Set Start via Map (Hall Building ID)
        await element(by.id('select-start-on-map')).tap();
        console.log("Select start on Map pressed");

        // Tapping Hall building
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        console.log("Hall Building selected as start");

        //Tapping loyola toggle
        await element(by.id('campus-selector-loyola')).tap();
        console.log("Loyola toggle pressed");

        // Set Destination via Map (LB Building ID)
        await element(by.id('select-destination-on-map')).tap();
        console.log("Select destination on Map pressed");


        //Selecting destination
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        console.log("CJ Building selected as destination at loyola campus");

        // Verify markers
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
        await element(by.id('map')).atIndex(0).pinch(0.98, 'fast', 0);
        await new Promise(resolve => setTimeout(resolve, 5000));
    });

    it('Path B: should select start via Current Location and destination via search', async () => {
        await device.disableSynchronization();

        // Spoof location to Hall Building for "Current Location"
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await device.setLocation(hallCoords.latitude, hallCoords.longitude);

        await device.launchApp({
            newInstance: true,
            permissions: { location: 'always' },
        });

        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();

        // Open building selector
        await element(by.id('building-selector-toggle')).tap();
        await waitFor(element(by.id('use-current-location-button'))).toBeVisible().withTimeout(5000);

        // 1. Use Current Location (Start)
        await element(by.id('use-current-location-button')).tap();
        // The picker should update the Start field to name 'Hall Building' or address
        await waitFor(element(by.id('start-marker'))).toExist().withTimeout(10000);
        console.log("Current location (Hall) used as start");

        // 2. Search for Destination (Communications & Journalism Building)
        // Add a small wait for the panel to be fully settled and interactive
        await new Promise(resolve => setTimeout(resolve, 2000));
        await waitFor(element(by.id('destination-building-selector'))).toBeVisible().withTimeout(5000);
        await element(by.id('destination-building-selector')).tap();
        await element(by.id('destination-building-selector')).typeText('Communications & Journalism Building');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Tap the first search result directly
        await waitFor(element(by.id('search-result-item'))).toExist().withTimeout(10000);
        await element(by.id('search-result-item')).atIndex(0).tap({ x: 100, y: 10 });

        // Verify markers appear
        await waitFor(element(by.id('destination-marker'))).toExist().withTimeout(20000);
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
    });

});
