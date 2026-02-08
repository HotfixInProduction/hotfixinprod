import { device } from 'detox';

beforeAll(async () => {
    const metro = encodeURIComponent('http://localhost:8081');
    await device.launchApp({
        newInstance: true,
        permissions: { location: 'always' }
    });
});


