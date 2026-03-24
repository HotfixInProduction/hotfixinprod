import { device, element, by, waitFor } from 'detox';
import { setupApp, setupAppWithPersistence, dismissAlert } from './helpers';

describe('Epic 3: Google Calendar Integration E2E Test', () => {

    it('AT 3.1-3.6: Should select different calendars (Persistent Session)', async () => {
        // Setup app WITHOUT wiping data (assumes user is manually logged in on simulator)
        await setupAppWithPersistence({ location: 'always' });

        // Navigate to the Schedule screen
        await waitFor(element(by.id('tab-schedule'))).toExist().withTimeout(15000);
        await element(by.id('tab-schedule')).tap();

        // If you are already logged in, the "Primary Calendar" should exist without a connect step
        await waitFor(element(by.text('Primary Calendar')).atIndex(0)).toExist().withTimeout(20000);

        // Tap on "Primary Calendar" to open the Select Calendar modal
        await element(by.text('Primary Calendar')).atIndex(0).tap();

        // Wait for the modal and tap "Holidays in Canada"
        await waitFor(element(by.text('Select Calendar'))).toExist().withTimeout(2000);
        await element(by.text('Holidays in Canada')).atIndex(0).tap();

        // Wait for selection to apply visually
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Tap on "Holidays in Canada" (the new trigger text) to open modal again
        await element(by.text('Holidays in Canada')).atIndex(0).tap();

        // Wait for the modal and tap "Concordia School"
        await waitFor(element(by.text('Select Calendar'))).toExist().withTimeout(2000);
        await element(by.text('Concordia School')).atIndex(0).tap();

        // Wait to visually confirm the switch to Concordia School
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
});
