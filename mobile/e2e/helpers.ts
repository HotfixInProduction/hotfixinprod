import { device, element, by, expect, waitFor } from 'detox';

export const setupApp = async (permissions: any = { location: 'always' }, location?: { latitude: number, longitude: number }) => {
    await device.disableSynchronization();
    if (location) {
        await device.setLocation(location.latitude, location.longitude);
    }
    await device.launchApp({
        newInstance: true,
        permissions,
    });
};

export const setupAppWithPersistence = async (permissions: any = { location: 'always' }, location?: { latitude: number, longitude: number }) => {
    await device.disableSynchronization();
    if (location) {
        await device.setLocation(location.latitude, location.longitude);
    }
    await device.launchApp({
        newInstance: true,
        permissions,
        delete: false,
    });
};

export const navigateToMap = async () => {
    await waitFor(element(by.id('tab-map'))).toExist().withTimeout(15000);
    await element(by.id('tab-map')).tap();
};

export const zoomIn = async (pinchAmount: number = 3.0) => {
    await element(by.id('map')).atIndex(0).pinch(pinchAmount, 'slow', 0);
    await new Promise(resolve => setTimeout(resolve, 3000));
};

export const openBuildingSelector = async () => {
    await waitFor(element(by.id('building-selector-toggle'))).toBeVisible().withTimeout(5000);
    await element(by.id('building-selector-toggle')).tap();
    await waitFor(element(by.id('start-building-selector'))).toBeVisible().withTimeout(10000);
};

export const selectCampus = async (campus: 'downtown' | 'loyola') => {
    const testId = `campus-selector-${campus}`;
    await element(by.id(testId)).tap();
};

export const searchAndSelectBuilding = async (selectorId: string, text: string) => {
    await waitFor(element(by.id(selectorId))).toBeVisible().withTimeout(5000);
    await element(by.id(selectorId)).tap();
    await element(by.id(selectorId)).typeText(text);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await waitFor(element(by.id('search-result-item'))).toExist().withTimeout(10000);
    await element(by.id('search-result-item')).atIndex(0).tap({ x: 100, y: 10 });
};

export const dismissAlert = async (label: string = 'OK') => {
    try {
        await waitFor(element(by.label(label))).toExist().withTimeout(2000);
        await element(by.label(label)).tap();
    } catch (e) {
        console.log(`Alert with label ${label} not found or already dismissed.`);
    }
};

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
