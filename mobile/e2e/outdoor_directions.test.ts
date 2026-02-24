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

        // Open building selector (directions panel)
        await element(by.id('building-selector-toggle')).tap();
        await waitFor(element(by.id('select-start-on-map'))).toBeVisible().withTimeout(5000);
        console.log("Building selector opened");

        // Set Start via Map (Hall Building ID)
        await element(by.id('select-start-on-map')).tap();
        await element(by.id('building-marker-Hall Building')).tap();
        await waitFor(element(by.id('start-marker'))).toExist().withTimeout(5000);
        console.log("Hall Building selected as start");

        // Set Destination via Map (LB Building ID)
        await element(by.id('select-destination-on-map')).tap();
        await element(by.id('building-marker-LB Building')).tap();
        await waitFor(element(by.id('destination-marker'))).toExist().withTimeout(5000);
        console.log("LB Building selected as destination");

        // Verify markers
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
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
        await waitFor(element(by.id('start-marker'))).toExist().withTimeout(5000);
        console.log("Current location (Hall) used as start");

        // 2. Search for Destination (JMSB)
        await element(by.id('destination-building-selector')).tap();
        await element(by.id('destination-building-selector')).typeText('John Molson Building');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await element(by.text('1600 De Maisonneuve Blvd. W.')).atIndex(0).tap();

        // Verify markers appear
        await waitFor(element(by.id('destination-marker'))).toExist().withTimeout(5000);
        await expect(element(by.id('start-marker'))).toExist();
        await expect(element(by.id('destination-marker'))).toExist();
    });

});
