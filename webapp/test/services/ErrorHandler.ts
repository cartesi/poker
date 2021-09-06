import { describe } from "mocha";
import { expect } from "chai";
import { ErrorHandler } from "../../src/services/ErrorHandler";

describe("ErrorHandler", function () {
    this.timeout(60000);

    it("Should have a default positive attempt interval", async () => {
        expect(ErrorHandler.getAttemptInterval()).to.be.gt(0);
    });

    it("Should respect user specified attempt interval", async () => {
        ErrorHandler.setAttemptInterval(15234);
        expect(ErrorHandler.getAttemptInterval()).to.equal(15234);
    });

    it("Should attempt execution until successful", async () => {
        ErrorHandler.setAttemptInterval(10);
        let shouldFail = true;
        let hasFailed = false;
        let hasSucceeded = false;
        ErrorHandler.execute("ErrorHandler Exec", async () => {
            if (shouldFail) {
                hasFailed = true;
                throw "Expected failure";
            } else {
                hasSucceeded = true;
            }
        });
        expect(hasFailed).to.be.true;
        expect(hasSucceeded).to.be.false;

        // set "shouldFail" to false, wait a while, and check again
        shouldFail = false;
        await new Promise((resolve) => setTimeout(resolve, ErrorHandler.getAttemptInterval() * 2));
        expect(hasSucceeded).to.be.true;
    });

    it("Should call execution callback when error is thrown", async () => {
        let callbackIndex;
        let callbackTitle;
        let callbackError;
        ErrorHandler.setOnError((index, title, error) => {
            callbackIndex = index;
            callbackTitle = title;
            callbackError = error;
        });
        let shouldFail = true;
        ErrorHandler.execute("ErrorHandler Exec", async () => {
            if (shouldFail) throw "Expected failure";
        });
        shouldFail = false;
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(callbackIndex, "index not set").to.not.equal(undefined);
        expect(callbackTitle, "title not set").to.equal("ErrorHandler Exec");
        expect(callbackError, "error not set").to.equal("Expected failure");
    });

    it("Should interrupt execution when requested", async () => {
        ErrorHandler.setAttemptInterval(10);
        let execIndex;
        ErrorHandler.setOnError((index, title, error) => {
            execIndex = index;
        });
        let attempts = 0;
        ErrorHandler.execute("ErrorHandler Exec", async () => {
            attempts++;
            throw "Expected failure";
        });
        await new Promise((resolve) => setTimeout(resolve, ErrorHandler.getAttemptInterval() * 2));
        expect(attempts).to.be.gt(0);

        ErrorHandler.interrupt(execIndex);
        attempts = 0;
        await new Promise((resolve) => setTimeout(resolve, ErrorHandler.getAttemptInterval() * 2));
        expect(attempts).to.equal(0);
    });
});
