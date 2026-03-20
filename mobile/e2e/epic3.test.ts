import { device, element, by, waitFor } from 'detox';
import { setupApp, dismissAlert } from './helpers';

describe('Epic 3: Google Calendar Integration E2E Test', () => {
    it('AT 3.1: Should navigate to Schedule screen and tap Connect Google Calendar', async () => {
        // Setup app without specific location requirements for calendar
        await setupApp({ location: 'always' });

        // Navigate to the Schedule screen using the bottom tab
        // The testID 'tab-schedule' is defined in App.tsx
        await waitFor(element(by.id('tab-schedule'))).toExist().withTimeout(15000);
        await element(by.id('tab-schedule')).tap();

        // Wait for the Connect Google Calendar button to appear
        // Since it doesn't have a testID, we find it by text
        await waitFor(element(by.text('Connect Google Calendar')).atIndex(0)).toExist().withTimeout(5000);

        // Tap the connect button to trigger the OAuth flow
        await element(by.text('Connect Google Calendar')).atIndex(0).tap();

        // Add a small wait to visually see the action before test ends
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
});
