// Try to return an expected event in an given events array
//
// Parameters:
// eventName expected event
// parser contract that know the expected event definition
// events array of events that will be evaluated 
export function tryReturnEvent(eventName, parser, events) {
    let expectedEvent = null;
    for (let i = 0; i < events.length; i++) {
        let found = false;
        try {
            expectedEvent = parser.interface.parseLog(events[i]);
            if (expectedEvent.name == eventName) found = true;
        } catch (e) {
            // do nothing, just skip to the next try
        }
        if (found) break;
    }
    return expectedEvent;
}