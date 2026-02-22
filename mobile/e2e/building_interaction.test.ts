import { device, element, by, expect, waitFor } from 'detox';

describe('Building Interaction E2E Test', () => {

    it('should tap on a building and show/close the info popup', async () => {
        await device.disableSynchronization();

        // Spoof location to Hall Building so the map centers there
        const hallCoords = { latitude: 45.497170, longitude: -73.579000 };
        await device.setLocation(hallCoords.latitude, hallCoords.longitude);

        await device.launchApp({
            newInstance: true,
            permissions: { location: 'always' },
        });

        // Navigate to the Map screen
        await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
        await element(by.id('tab-map')).tap();
        console.log('Navigated to Map screen');

        // Wait for the map to fully load and center on our spoofed location
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Zoom in with pinch so building polygon fills more of the screen
        await element(by.id('map')).atIndex(0).pinch(3.0, 'slow', 0);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Map zoomed in');

        // Tap in the center of the map where the Hall Building polygon should be.
        // Since we spoofed location to the building's center and zoomed in,
        // the polygon is under our current position in the middle of the screen.
        // We tap slightly below center to hit the polygon, avoiding UI overlays.
        await element(by.id('map')).atIndex(0).tap({ x: 200, y: 550 });
        console.log('Tapped on building polygon area');

        // Verify the building info popup appears
        await waitFor(element(by.id('building-title'))).toExist().withTimeout(10000);
        await expect(element(by.id('building-title'))).toHaveText('Hall Building');
        console.log('Building popup verified');

        // Close the popup
        await element(by.id('building-close')).tap();
        console.log('Popup closed');

        // Verify the popup is gone
        await waitFor(element(by.id('building-title'))).not.toExist().withTimeout(5000);
        console.log('Popup dismissal verified');
    });

});
