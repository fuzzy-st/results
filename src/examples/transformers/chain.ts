/**
 * Examples demonstrating the usage of the chain method
 * from the Result pattern library.
 */

import { chain } from "~/lib/transformers/chain";
import { success } from "~/lib/core/success";
import { error } from "~/lib/core/error";
import type { Result } from "~/types";

/**
 * Example 1: Basic Chain Usage
 * 
 * Demonstrates the basic usage of chain with simple validations
 */
export function basicChainExamples() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 1: Basic Chain Usage");

    // A validation function that requires positive numbers
    function validatePositive(n: number): Result<number, Error> {
        return n > 0
            ? success(n)
            : error(new Error("Number must be positive"));
    }

    // A transformation function that doubles a number and can't fail
    function double(n: number): Result<number> {
        return success(n * 2);
    }

    // Positive number scenario
    const positiveResult = success(5);
    const validatedPositive = chain(positiveResult, validatePositive);
    const doubledPositive = chain(validatedPositive, double);

    console.log("Initial Positive Result:", positiveResult);
    console.log("Validated Positive Result:", validatedPositive);
    console.log("Doubled Positive Result:", doubledPositive);

    // Negative number scenario
    const negativeResult = success(-5);
    const validatedNegative = chain(negativeResult, validatePositive);
    const doubledNegative = chain(validatedNegative, double); // Won't execute double

    console.log("Initial Negative Result:", negativeResult);
    console.log("Validated Negative Result:", validatedNegative);
    console.log("Doubled Negative Result:", doubledNegative);

    // Original error scenario
    const errorResult = error(new Error("Original error"));
    const validatedError = chain(errorResult, validatePositive); // Won't execute validation
    const doubledError = chain(validatedError, double); // Won't execute double

    console.log("Initial Error Result:", errorResult);
    console.log("Validated Error Result:", validatedError);
    console.log("Doubled Error Result:", doubledError);

    return {
        positiveResult, validatedPositive, doubledPositive,
        negativeResult, validatedNegative, doubledNegative,
        errorResult, validatedError, doubledError
    };
}

/**
 * Example 2: Data Parsing and Validation Chain
 * 
 * Shows how to use chain for parsing and validating data
 */
export function dataParsingExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 2: Data Parsing and Validation Chain");

    // Parse a string to a number
    function parseNumber(str: string): Result<number, Error> {
        const num = Number(str);
        return isNaN(num)
            ? error(new Error(`Invalid number format: "${str}"`))
            : success(num);
    }

    // Validate age is in a reasonable range
    function validateAge(age: number): Result<number, Error> {
        if (age < 0) {
            return error(new Error("Age cannot be negative"));
        } else if (age > 120) {
            return error(new Error("Age is unrealistically high"));
        }
        return success(age);
    }

    // Categorize age into an age group
    function categorizeAge(age: number): Result<string> {
        if (age < 18) {
            return success("minor");
        } else if (age < 65) {
            return success("adult");
        } else {
            return success("senior");
        }
    }

    // Process user inputs
    const validInput = success("42");
    const invalidFormat = success("not-a-number");
    const negativeAge = success("-5");
    const unrealisticAge = success("150");

    // Create processing chains
    console.log("Processing valid input: '42'");
    const validChain = chain(
        chain(
            chain(validInput, parseNumber),
            validateAge
        ),
        categorizeAge
    );
    console.log("Valid Chain Result:", validChain);

    console.log("\nProcessing invalid format: 'not-a-number'");
    const invalidFormatChain = chain(
        chain(
            chain(invalidFormat, parseNumber),
            validateAge
        ),
        categorizeAge
    );
    console.log("Invalid Format Chain Result:", invalidFormatChain);

    console.log("\nProcessing negative age: '-5'");
    const negativeAgeChain = chain(
        chain(
            chain(negativeAge, parseNumber),
            validateAge
        ),
        categorizeAge
    );
    console.log("Negative Age Chain Result:", negativeAgeChain);

    console.log("\nProcessing unrealistic age: '150'");
    const unrealisticAgeChain = chain(
        chain(
            chain(unrealisticAge, parseNumber),
            validateAge
        ),
        categorizeAge
    );
    console.log("Unrealistic Age Chain Result:", unrealisticAgeChain);

    return {
        validInput, validChain,
        invalidFormat, invalidFormatChain,
        negativeAge, negativeAgeChain,
        unrealisticAge, unrealisticAgeChain
    };
}

/**
 * Example 3: Database Operations Chain
 * 
 * Demonstrates using chain for complex database-like operations
 */
interface User {
    id: number;
    name: string;
    email: string;
}

interface Post {
    id: number;
    userId: number;
    title: string;
    content: string;
}

interface Comment {
    id: number;
    postId: number;
    userId: number;
    text: string;
}
export function databaseOperationsExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 3: Database Operations Chain");

    // Define our domain models

    // Mock database
    const users: User[] = [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" }
    ];

    const posts: Post[] = [
        { id: 101, userId: 1, title: "Alice's first post", content: "Hello world!" },
        { id: 102, userId: 1, title: "Alice's second post", content: "Still here!" },
        { id: 201, userId: 2, title: "Bob's post", content: "Hi everyone!" }
    ];

    const comments: Comment[] = [
        { id: 1001, postId: 101, userId: 2, text: "Great post, Alice!" },
        { id: 1002, postId: 201, userId: 1, text: "Thanks for sharing, Bob!" },
        { id: 1003, postId: 102, userId: 2, text: "Interesting thoughts." }
    ];

    // Database operation functions
    function findUser(userId: number): Result<User, Error> {
        const user = users.find(u => u.id === userId);
        return user
            ? success(user)
            : error(new Error(`User ${userId} not found`));
    }

    function findUserPosts(user: User): Result<Post[], Error> {
        const userPosts = posts.filter(p => p.userId === user.id);
        return success(userPosts);
    }

    function findPostComments(post: Post): Result<Comment[], Error> {
        const postComments = comments.filter(c => c.postId === post.id);
        return success(postComments);
    }

    function findCommenterNames(comments: Comment[]): Result<string[], Error> {
        const commenterNames: string[] = [];

        for (const comment of comments) {
            const user = users.find(u => u.id === comment.userId);
            if (!user) {
                return error(new Error(`Commenter with ID ${comment.userId} not found`));
            }
            commenterNames.push(user.name);
        }

        return success(commenterNames);
    }

    // Execute a chain of operations - Find Alice's first post commenters
    console.log("Finding commenters on Alice's first post:");
    const aliceId = 1;
    const aliceFirstPostId = 101;

    // Step 1: Find user
    const userResult = findUser(aliceId);
    console.log("User Result:", userResult);

    // Step 2: Find user's posts
    const postsResult = chain(userResult, findUserPosts);
    console.log("Posts Result:", postsResult);

    // Step 3: Find Alice's first post
    const firstPostResult = chain(postsResult, posts => {
        const firstPost = posts.find(p => p.id === aliceFirstPostId);
        return firstPost
            ? success(firstPost)
            : error(new Error(`Post ${aliceFirstPostId} not found`));
    });
    console.log("First Post Result:", firstPostResult);

    // Step 4: Find comments on the post
    const commentsResult = chain(firstPostResult, findPostComments);
    console.log("Comments Result:", commentsResult);

    // Step 5: Find commenter names
    const commenterNamesResult = chain(commentsResult, findCommenterNames);
    console.log("Commenter Names Result:", commenterNamesResult);

    // Similar chain for non-existent user
    console.log("\nFinding posts for non-existent user:");
    const nonExistentId = 999;

    const nonExistentUserChain = chain(
        findUser(nonExistentId),
        findUserPosts
    );
    console.log("Non-existent User Chain Result:", nonExistentUserChain);

    return {
        userResult,
        postsResult,
        firstPostResult,
        commentsResult,
        commenterNamesResult,
        nonExistentUserChain
    };
}

/**
 * Example 4: Practical Form Validation
 * 
 * Shows how to use chain for form validation with multiple fields
 */

// Define form data types
interface FormData {
    username: string;
    email: string;
    password: string;
    age: string; // String because it comes from input
}

interface ValidatedFormData {
    username: string;
    email: string;
    password: string;
    age: number; // Parsed to number
}
export function formValidationExample() {
    console.log(Array.from({ length: 20 }, (_, i) => "--").join(""));
    console.log("Example 4: Practical Form Validation");

    // Validation functions
    function validateUsername(formData: FormData): Result<FormData, Error> {
        if (!formData.username) {
            return error(new Error("Username is required"));
        }

        if (formData.username.length < 3) {
            return error(new Error("Username must be at least 3 characters"));
        }

        if (/[^a-zA-Z0-9_]/.test(formData.username)) {
            return error(new Error("Username can only contain letters, numbers, and underscores"));
        }

        return success(formData);
    }

    function validateEmail(formData: FormData): Result<FormData, Error> {
        if (!formData.email) {
            return error(new Error("Email is required"));
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return error(new Error("Invalid email format"));
        }

        return success(formData);
    }

    function validatePassword(formData: FormData): Result<FormData, Error> {
        if (!formData.password) {
            return error(new Error("Password is required"));
        }

        if (formData.password.length < 8) {
            return error(new Error("Password must be at least 8 characters"));
        }

        // Check for at least one number and one special character
        if (!/[0-9]/.test(formData.password)) {
            return error(new Error("Password must contain at least one number"));
        }

        if (!/[^a-zA-Z0-9]/.test(formData.password)) {
            return error(new Error("Password must contain at least one special character"));
        }

        return success(formData);
    }

    function validateAge(formData: FormData): Result<ValidatedFormData, Error> {
        if (!formData.age) {
            return error(new Error("Age is required"));
        }

        const age = Number(formData.age);
        if (isNaN(age)) {
            return error(new Error("Age must be a number"));
        }

        if (age < 18) {
            return error(new Error("You must be 18 or older"));
        }

        if (age > 120) {
            return error(new Error("Invalid age value"));
        }

        return success({
            ...formData,
            age // Replace string with number
        });
    }

    // Valid form data
    const validForm: FormData = {
        username: "john_doe",
        email: "john@example.com",
        password: "Password123!",
        age: "30"
    };

    // Invalid form data examples
    const invalidUsername: FormData = {
        username: "j@",
        email: "john@example.com",
        password: "Password123!",
        age: "30"
    };

    const invalidEmail: FormData = {
        username: "john_doe",
        email: "not-an-email",
        password: "Password123!",
        age: "30"
    };

    const invalidPassword: FormData = {
        username: "john_doe",
        email: "john@example.com",
        password: "password",
        age: "30"
    };

    const invalidAge: FormData = {
        username: "john_doe",
        email: "john@example.com",
        password: "Password123!",
        age: "seventeen"
    };

    // Validate forms
    console.log("Validating valid form:");
    const validFormResult = chain(
        chain(
            chain(
                chain(
                    success(validForm),
                    validateUsername
                ),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
    console.log("Valid Form Result:", validFormResult);

    console.log("\nValidating invalid username:");
    const invalidUsernameResult = chain(
        chain(
            chain(
                chain(
                    success(invalidUsername),
                    validateUsername
                ),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
    console.log("Invalid Username Result:", invalidUsernameResult);

    console.log("\nValidating invalid email:");
    const invalidEmailResult = chain(
        chain(
            chain(
                chain(
                    success(invalidEmail),
                    validateUsername
                ),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
    console.log("Invalid Email Result:", invalidEmailResult);

    console.log("\nValidating invalid password:");
    const invalidPasswordResult = chain(
        chain(
            chain(
                chain(
                    success(invalidPassword),
                    validateUsername
                ),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
    console.log("Invalid Password Result:", invalidPasswordResult);

    console.log("\nValidating invalid age:");
    const invalidAgeResult = chain(
        chain(
            chain(
                chain(
                    success(invalidAge),
                    validateUsername
                ),
                validateEmail
            ),
            validatePassword
        ),
        validateAge
    );
    console.log("Invalid Age Result:", invalidAgeResult);

    return {
        validFormResult,
        invalidUsernameResult,
        invalidEmailResult,
        invalidPasswordResult,
        invalidAgeResult
    };
}

// Run all examples
function runChainExamples() {
    basicChainExamples();
    dataParsingExample();
    databaseOperationsExample();
    formValidationExample();
}

// Uncomment to run
// runChainExamples();