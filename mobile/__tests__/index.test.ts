describe('index.ts', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('registers App as the root component', () => {
    const registerRootComponent = jest.fn();
    const appMock = { mocked: true };

    jest.doMock('expo', () => ({
      registerRootComponent,
    }));

    jest.doMock('../App', () => ({
      __esModule: true,
      default: appMock,
    }));

    require('../index');

    expect(registerRootComponent).toHaveBeenCalledTimes(1);
    expect(registerRootComponent).toHaveBeenCalledWith(appMock);
  });
});
