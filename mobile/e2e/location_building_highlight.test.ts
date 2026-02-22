import { device, element, by, expect, waitFor } from 'detox';

describe('US-1 Location Permissions and Building Highlight Maps', () => {

    it('Scenario 1: Denied location permission displays a message or handles fallback gracefully', async () => {
        await device.disableSynchronization();
        await device.launchApp({
            newInstance: true,
            permissions: { location: 'never' },
        });
        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();

        // The app shows an Alert if denied. We must dismiss the alert first!
        // The alert has text 'Location needed' and button 'OK'
        try {
            await waitFor(element(by.label('OK'))).toExist().withTimeout(2000);
            await element(by.label('OK')).tap();
        } catch (e) {
            console.log('No alert found or already dismissed.');
        }

        // Verify the location-off button is visible. Give it ample time to render state changes.
        await waitFor(element(by.id('location-off-button'))).toBeVisible().withTimeout(10000);
        await expect(element(by.id('location-off-button'))).toBeVisible();

    });

    it('Scenario 2: Granted location permission shows user location and highlights current building', async () => {
        await device.disableSynchronization();
        // Relaunch the app with location permissions granted and a specific spoofed location
        // spoofing location to Hall Building. Use a coordinate safely inside the polygon.
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await device.setLocation(hallCoords.latitude, hallCoords.longitude);

        await device.launchApp({
            newInstance: true,
            permissions: { location: 'always' },
        });
        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();

        // Map should eventually settle and show the Hall Building as highlighted
        // The polygon testID format: building-polygon-{id}-highlighted when user is inside.
        // The id for Hall Building in buildings.js is 'Hall Building'
        await waitFor(element(by.id('building-polygon-Hall Building-highlighted'))).toExist().withTimeout(15000);
    });

    it('Scenario 3: Moving to a different building updates the highlight correctly', async () => {
        await device.disableSynchronization();
        // Relaunch the app with EV Building coordinates
        const EVCoords = { latitude: 45.495622, longitude: -73.578121 }; // Inside EV Building
        await device.setLocation(EVCoords.latitude, EVCoords.longitude);

        await device.launchApp({
            newInstance: true,
            permissions: { location: 'always' },
        });

        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();

        // Verify the EV building is highlighted
        const evHighlightId = 'building-polygon-Engineering, Computer Science and Visual Arts Integrated Complex (EV Building)-highlighted';
        await waitFor(element(by.id(evHighlightId))).toExist().withTimeout(20000);

        // Verify that the Hall Building is NOT highlighted
        await expect(element(by.id('building-polygon-Hall Building-highlighted'))).not.toExist();
    });

});
