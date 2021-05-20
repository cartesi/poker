#!/usr/bin/lua

local turns = io.open(arg[1])

local isPlayer0 = true;
local isWinnerPlayer0 = true;
local maxValue = 0;

while true do
    local expr = turns:read(1024)
    if expr == nil then break end

    expr = string.unpack("z", expr)
    if expr == '' then break end
    
    local f = load("return "..expr)
    if f == nil then break end

    -- print("Turn expression: "..expr)

    local value = f()
    if value > maxValue then
        maxValue = value
        isWinnerPlayer0 = isPlayer0
        -- print(maxValue)
    end
    isPlayer0 = not isPlayer0
end

-- print("Winner is " .. (isWinnerPlayer0 and "Player0" or "Player1"))
print(isWinnerPlayer0)
