import { jest } from '@jest/globals';
import { IDatabaseConnection } from '../config/db';
import { mockNativeRun, mockNativeGet, mockNativeAll, mockNativeClose, mockNativeOn } from './sqlite3.mock';

// Define the generic function types explicitly for clarity (optional but good practice)
type GetFn = <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
type AllFn = <T = any>(sql: string, params?: any[]) => Promise<T[]>;

/**
 * Creates a Jest mock object implementing the IDatabaseConnection interface.
 * This is intended for testing components that depend on the abstraction
 * provided by IDatabaseConnection (like DatabaseService SHOULD).
 * Allows overriding specific methods for different test cases.
 *
 * @param overrides - Optional partial implementation to customize mock behavior.
 * @returns A mock object conforming to IDatabaseConnection, with methods as Jest mocks.
 */
export const createMockDbConnection = (overrides?: Partial<IDatabaseConnection>): jest.Mocked<IDatabaseConnection> => {
    // Create a mock native driver instance that can be returned by getNativeDriver
    // Uses the NATIVE mocks defined above.
    const mockNativeDriver = {
        run: mockNativeRun,
        get: mockNativeGet,
        all: mockNativeAll,
        close: mockNativeClose,
        on: mockNativeOn,
        // Add other native properties/methods if they are ever accessed via getNativeDriver
    };

    // FIX: Create mock functions using jest.fn with the generic type directly from the interface.
    // Use mockImplementation for a clean default implementation that matches the Promise return type.
    const mockGet = jest.fn<GetFn>().mockImplementation(async <T>() => undefined as T | undefined) as jest.MockedFunction<GetFn>;
    const mockAll = jest.fn<AllFn>().mockImplementation(async <T>() => [] as T[]) as jest.MockedFunction<AllFn>;

    const mockConnection: jest.Mocked<IDatabaseConnection> = {
        /** Mock for IDatabaseConnection.run - returns Promise<void> */
        // No generics here, this should be fine. Explicitly type for consistency.
        run: jest.fn<IDatabaseConnection['run']>().mockResolvedValue(undefined),

        /** Mock for IDatabaseConnection.get - returns Promise<T | undefined> */
        // Assign the correctly typed mock function created above.
        get: mockGet,

        /** Mock for IDatabaseConnection.all - returns Promise<T[]> */
        // Assign the correctly typed mock function created above.
        all: mockAll,

        /** Mock for IDatabaseConnection.close - returns Promise<void> */
        // No generics here, this should be fine. Explicitly type for consistency.
        close: jest.fn<IDatabaseConnection['close']>().mockResolvedValue(undefined),

        /** Mock for IDatabaseConnection.getNativeDriver - returns a mock native driver */
        // No generics here, this should be fine. Explicitly type for consistency.
        getNativeDriver: jest.fn<IDatabaseConnection['getNativeDriver']>().mockReturnValue(mockNativeDriver),

        // Apply any overrides provided when creating the mock.
        // The spread operator applies overrides correctly. Ensure the provided overrides
        // are also correctly typed jest.Mock functions if they replace existing mocks.
        ...(overrides as Partial<jest.Mocked<IDatabaseConnection>>),
    };

    // FIX: Removed redundant override application logic that was present after the spread operator.
    // The spread operator handles merging overrides effectively. If an override for 'get' or 'all'
    // is provided, it should be a jest.Mock function compatible with IDatabaseConnection['get'] or ['all'].

    return mockConnection;
};