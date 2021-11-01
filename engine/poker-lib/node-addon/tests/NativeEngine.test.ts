import { expect } from "chai";
import { BigNumber } from "ethers";
import { StatusCode, EngineBetType, EngineStep } from "../src/Engine";
import { NativeEngine } from "../src/NativeEngine";
const path = require("path");

const lib_path = `${path.resolve(__dirname, "..")}/build/Release/pokerlib.node`;

describe("A complete game", () => {
    it("should run without errors - The happy path", async () => {
        const alice = new NativeEngine(0, lib_path);
        let r = await alice.init(BigNumber.from(200), BigNumber.from(300), BigNumber.from(10), true);
        expect(r.status).to.equal(StatusCode.SUCCESS);

        const bob = new NativeEngine(1, lib_path);
        r = await bob.init(BigNumber.from(200), BigNumber.from(300), BigNumber.from(10), true);
        expect(r.status).to.equal(StatusCode.SUCCESS);

        // Handshake
        const r0 = await alice.create_handshake();
        expect(r0.status).to.equal(StatusCode.CONTINUED);
        expect(r0.message_out).to.not.be.null;

        const r1 = await bob.process_handshake(r0.message_out);
        expect(r1.status).to.equal(StatusCode.CONTINUED);
        expect(r1.message_out).to.not.be.null;

        const r2 = await alice.process_handshake(r1.message_out);
        expect(r2.status).to.equal(StatusCode.CONTINUED);
        expect(r2.message_out).to.not.be.null;

        const r3 = await bob.process_handshake(r2.message_out);
        expect(r3.status).to.equal(StatusCode.CONTINUED);
        expect(r3.message_out).to.not.be.null;

        const r4 = await alice.process_handshake(r3.message_out);
        expect(r4.status).to.equal(StatusCode.SUCCESS);
        expect(r4.message_out).to.not.be.null;

        let r5 = await bob.process_handshake(r4.message_out);
        expect(r5.status).to.equal(StatusCode.SUCCESS);
        expect(r5.message_out).to.be.null;

        /* Bets */
        // Preflop: Alice calls
        r5 = await alice.create_bet(EngineBetType.BET_CALL, BigNumber.from(0));
        expect(r5.status).to.equal(StatusCode.SUCCESS);

        let r6 = await bob.process_bet(r5.message_out);
        expect(r6.status).to.equal(StatusCode.SUCCESS);

        // Preflop: Bob checks
        r6 = await bob.create_bet(EngineBetType.BET_CHECK, BigNumber.from(0));
        expect(r6.status).to.equal(StatusCode.CONTINUED);
        const r7 = await alice.process_bet(r6.message_out);
        expect(r7.status).to.equal(StatusCode.SUCCESS);
        let r8 = await bob.process_bet(r7.message_out);
        expect(r8.status).to.equal(StatusCode.SUCCESS);

        // Flop: Bob checks
        r8 = await bob.create_bet(EngineBetType.BET_CHECK, BigNumber.from(0));
        expect(r8.status).to.equal(StatusCode.SUCCESS);
        let r9 = await alice.process_bet(r8.message_out);
        expect(r9.status).to.equal(StatusCode.SUCCESS);

        // Flop: Alice checks
        r9 = await alice.create_bet(EngineBetType.BET_CHECK, BigNumber.from(0));
        expect(r9.status).to.equal(StatusCode.CONTINUED);
        let r10 = await bob.process_bet(r9.message_out);
        expect(r10.status).to.equal(StatusCode.SUCCESS);
        let r11 = await alice.process_bet(r10.message_out);
        expect(r11.status).to.equal(StatusCode.SUCCESS);

        // Turn: Bob raises
        r11 = await bob.create_bet(EngineBetType.BET_RAISE, BigNumber.from(30));
        expect(r11.status).to.equal(StatusCode.SUCCESS);
        let r12 = await alice.process_bet(r11.message_out);
        expect(r12.status).to.equal(StatusCode.SUCCESS);

        // Alice calls
        r12 = await alice.create_bet(EngineBetType.BET_CALL, BigNumber.from(0));
        expect(r12.status).to.equal(StatusCode.CONTINUED);
        let r13 = await bob.process_bet(r12.message_out);
        expect(r13.status).to.equal(StatusCode.SUCCESS);
        let r14 = await alice.process_bet(r13.message_out);
        expect(r14.status).to.equal(StatusCode.SUCCESS);

        // Bob checks
        r14 = await bob.create_bet(EngineBetType.BET_CHECK, BigNumber.from(0));
        expect(r14.status).to.equal(StatusCode.SUCCESS);
        let r15 = await alice.process_bet(r14.message_out);
        expect(r15.status).to.equal(StatusCode.SUCCESS);

        // Alice checks
        r15 = await alice.create_bet(EngineBetType.BET_CHECK, BigNumber.from(0));
        expect(r15.status).to.equal(StatusCode.CONTINUED);
        let r16 = await bob.process_bet(r15.message_out);
        expect(r16.status).to.equal(StatusCode.CONTINUED);
        let r17 = await alice.process_bet(r16.message_out);
        expect(r17.status).to.equal(StatusCode.SUCCESS);
        let r18 = await bob.process_bet(r17.message_out);
        expect(r18.status).to.equal(StatusCode.SUCCESS);

        const gAlice = await await alice.game_state();
        console.log(gAlice);
        const gBob = await await bob.game_state();
        console.log(gBob);

        expect(gAlice.winner).to.not.equal(-1);
        expect(gAlice.winner).to.equal(gBob.winner);

        expect(gAlice.step).to.equal(EngineStep.GAME_OVER);
        expect(gBob.step).to.equal(EngineStep.GAME_OVER);
    });
});
