/**
 * Examples demonstrating the usage of the map method
 * from the Result pattern library.
 */

import { map } from "~/lib/transformers/map";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import type { Result } from "~/types";

/**
 * Example 1: Basic Map Usage
 * 
 * Demonstrates how to transform success values using map
 */
export function basicMapExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic Map Usage");

    // Map a number to its double
    const numberResult = success(42);
    const doubledResult = map(numberResult, x => x * 2);
    console.log("Original Number Result:", numberResult);
    console.log("Doubled Number Result:", doubledResult);

    // Map a string to uppercase
    const stringResult = success("hello world");
    const uppercaseResult = map(stringResult, str => str.toUpperCase());
    console.log("Original String Result:", stringResult);
    console.log("Uppercase String Result:", uppercaseResult);

    // Map an error result (no change)
    const errorResult = error(new Error("Something went wrong"));
    const mappedErrorResult = map(errorResult, x => x * 2);
    console.log("Original Error Result:", errorResult);
    console.log("Mapped Error Result:", mappedErrorResult);

    return { numberResult, doubledResult, stringResult, uppercaseResult, errorResult, mappedErrorResult };
}

/**
 * Example 2: Complex Object Transformations
 * 
 * Shows how to use map with complex object structures
 */
export function complexObjectMapExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Complex Object Transformations");

    // User object transformation
    const userResult = success({ name: "John Doe", age: 30, email: "john@example.com" });

    // Transform to user profile
    const profileResult = map(userResult, user => ({
        displayName: user.name,
        isAdult: user.age >= 18,
        contact: user.email
    }));

    console.log("Original User Result:", userResult);
    console.log("Profile Transformation:", profileResult);

    // Create stats from array
    const numbersResult = success([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const statsResult = map(numbersResult, numbers => {
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        const avg = sum / numbers.length;
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);

        return { sum, avg, max, min, count: numbers.length };
    });

    console.log("Original Numbers Result:", numbersResult);
    console.log("Stats Transformation:", statsResult);

    return { userResult, profileResult, numbersResult, statsResult };
}

/**
 * Example 3: Chaining Maps
 * 
 * Demonstrates composing multiple transformations using sequential map calls
 */
export function chainedMapExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Chaining Maps");

    // Start with a number
    const initialResult = success(5);

    // Chain of transformations
    const step1 = map(initialResult, x => x * 2);          // 10
    const step2 = map(step1, x => x + 1);                 // 11
    const step3 = map(step2, x => x.toString());          // "11"
    const step4 = map(step3, x => `Value is: ${x}`);      // "Value is: 11"
    const step5 = map(step4, x => x.length);              // 12

    console.log("Initial Result:", initialResult);
    console.log("Step 1 (x * 2):", step1);
    console.log("Step 2 (x + 1):", step2);
    console.log("Step 3 (toString):", step3);
    console.log("Step 4 (template):", step4);
    console.log("Step 5 (length):", step5);

    return { initialResult, step1, step2, step3, step4, step5 };
}

/**
 * Example 4: Real-World Usage Patterns
 * 
 * Shows practical applications of the map function in real-world scenarios
 */
export function realWorldMapExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Real-World Usage Patterns");
    // Simulated API response
    //@ts-ignore
    interface UserApiResponse {
        id: number;
        firstName: string;
        lastName: string;
        emailAddress: string;
        dateOfBirth: string;
        roles: string[];
    }

    //@ts-ignore
    // Application's user model
    interface User {
        id: number;
        fullName: string;
        email: string;
        age: number;
        isAdmin: boolean;
    }


    // Function to calculate age from DOB
    function calculateAge(dob: string): number {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    // Simulated successful API response
    const apiResponseResult = success<UserApiResponse>({
        id: 123,
        firstName: "Jane",
        lastName: "Smith",
        emailAddress: "jane.smith@example.com",
        dateOfBirth: "1990-05-15",
        roles: ["user", "editor", "admin"]
    });

    // Transform API response to application model
    const userResult = map(apiResponseResult, apiResponse => {
        const user: User = {
            id: apiResponse.id,
            fullName: `${apiResponse.firstName} ${apiResponse.lastName}`,
            email: apiResponse.emailAddress,
            age: calculateAge(apiResponse.dateOfBirth),
            isAdmin: apiResponse.roles.includes("admin")
        };

        return user;
    });

    console.log("API Response Result:", apiResponseResult);
    console.log("Transformed User Result:", userResult);

    // Another example: Handling paginated data
    //@ts-ignore
    interface PaginatedResponse<T> {
        items: T[];
        totalCount: number;
        page: number;
        pageSize: number;
    }
    //@ts-ignore
    interface Product {
        id: string;
        name: string;
        price: number;
    }

    // Simulated paginated response
    const paginatedResult = success<PaginatedResponse<Product>>({
        items: [
            { id: "p1", name: "Product 1", price: 19.99 },
            { id: "p2", name: "Product 2", price: 29.99 },
            { id: "p3", name: "Product 3", price: 9.99 }
        ],
        totalCount: 25,
        page: 1,
        pageSize: 3
    });

    // Transform to display-friendly format
    const displayResult = map(paginatedResult, response => {
        return {
            products: response.items.map(item => ({
                ...item,
                formattedPrice: `$${item.price.toFixed(2)}`
            })),
            pagination: {
                currentPage: response.page,
                totalPages: Math.ceil(response.totalCount / response.pageSize),
                hasNextPage: response.page * response.pageSize < response.totalCount,
                hasPrevPage: response.page > 1
            }
        };
    });

    console.log("Paginated Result:", paginatedResult);
    console.log("Display Result:", displayResult);

    return { apiResponseResult, userResult, paginatedResult, displayResult };
}

// Run all examples
function runMapExamples() {
    basicMapExamples();
    complexObjectMapExamples();
    chainedMapExamples();
    realWorldMapExamples();
}

// Uncomment to run
// runMapExamples();