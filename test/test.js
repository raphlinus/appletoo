var appleToo,
    setupTeardown = {
      setup: function() {
        appleToo = new AppleToo();
      },
      teardown: function() {
        appleToo = undefined;
      }
    },
    unset_flags = {N:0, V:0, _:0, B:0, D:0, I:0, Z:0, C:0},
    zero_flag = clone(unset_flags),
    neg_flag = clone(unset_flags),
    carry_flag = clone(unset_flags),
    overflow_neg_flag = clone(unset_flags),
    overflow_carry_flag = clone(unset_flags),
    dec_flag = clone(unset_flags),
    dec_carry_flag = clone(unset_flags),
    carry_neg_flag = clone(unset_flags);

zero_flag["Z"] = 1;
neg_flag["N"] = 1;
carry_flag["C"] = 1;
overflow_neg_flag["V"] = 1;
overflow_neg_flag["N"] = 1;
overflow_carry_flag["V"] = 1;
overflow_carry_flag["C"] = 1;
dec_flag["D"] = 1;
dec_carry_flag["D"] = 1;
dec_carry_flag["C"] = 1;
carry_neg_flag["C"] = 1;
carry_neg_flag["N"] = 1;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

//TODO: Make this less hacky and awful
function test_status_after(appleToo, program, expected_SR) {
  var opcode = parseInt(program.substr(0,2), 16);
  program = program.substr(2).replace(/\s+/g, "");
  if (program.length > 2) {
    appleToo.write_memory(appleToo.PC, parseInt(program.substr(0,2), 16));
    appleToo.write_memory(appleToo.PC+1, parseInt(program.substr(2,2), 16));
  } else {
    appleToo.write_memory(appleToo.PC, parseInt(program.substr(0,2), 16));
  }

  var test_string = "flag(s) should be set";
  for (var k in expected_SR) {
    if (expected_SR[k] === 1) {
      test_string = k + ", " + test_string;
    }
  }
  test_string = test_string.replace(", flag", " flag");
  OPCODES[opcode].call(appleToo);
  deepEqual(appleToo.get_status_flags(), expected_SR, test_string);
}


module("Helper functions", setupTeardown);
test("set_register", function() {
  expect(1);
  appleToo.set_register("XR", "01");
  equal(appleToo.XR, 1);
});
test("get_status_flags", function() {
  expect(1);
  deepEqual(appleToo.get_status_flags(), {N:0, V:0, _:0, B:0, D:0, I:0, Z:0, C:0});
});
test("set_status_flags", function() {
  expect(1);
  appleToo.set_status_flags({N:1, V:0, _:0, B:0, D:0, I:0, Z:1, C:0});
  equal(appleToo.SR, 130);
});
test("to_bcd", function(){
  expect(1);

  equal(to_bcd(34), parseInt("00110100",2));
});
test("from_bcd", function() {
  expect(1);

  equal(from_bcd(parseInt("00110100",2)), 34);
});

module("Memory Addressing Modes", setupTeardown);
test("Accumlator", function() {
  expect(2);

  appleToo.set_register("AC", 0xBB);

  equal(appleToo.accumulator(), 0xBB, "AppleToo.accumulator should return the value in the Accumulator register");
  equal(appleToo.PC, 0xC000, "Program Counter should not be incremented");
});

test("Immediate", function() {
  expect(2);

  var addr = appleToo.PC
  appleToo.write_memory(addr, 0xBB);

  equal(appleToo.immediate(), addr, "AppleToo.immediate should return the program counter");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Relative", function() {
  expect(3);

  //Running the function will change the program counter,
  //so we store the value to test before that
  var testValue = appleToo.PC + 0x10;
  appleToo.write_memory(appleToo.PC, 0x10);

  equal(appleToo.relative(), testValue, "AppleToo.relative should return the sum of the Program Counter and its argument");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");

  testValue = appleToo.PC - 1;
  appleToo.write_memory(appleToo.PC, 0xFF);

  equal(appleToo.relative(), testValue, "AppleToo.relative should return the sum of the Program Counter and its argument");
});

test("Zero Page", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);

  equal(appleToo.zero_page(), 0x01, "AppleToo.zero_page should return the given zero page address");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indexed With X", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);
  appleToo.set_register("XR", 0x01);

  equal(appleToo.zero_page_indexed_with_x(), 0x02, "AppleToo.zero_page_indexed_with_x should return the zero page address equal to the given address plus the value in the X register");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indexed With Y", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);
  appleToo.set_register("YR", 0x01);

  equal(appleToo.zero_page_indexed_with_y(), 0x02, "AppleToo.zero_page_indexed_with_y should return the zero page address equal to the given address plus the value in the Y register");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Absolute", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBF);
  appleToo.write_memory(appleToo.PC+1, 0x1B);

  equal(appleToo.absolute(), 0x1BBF, "AppleToo.absolute should return the given (two byte) address");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indexed With X", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBE);
  appleToo.write_memory(appleToo.PC+1, 0x1B);
  appleToo.set_register("XR", 0x01);

  equal(appleToo.absolute_indexed_with_x(), 0x1BBF, "AppleToo.absolute_indexed_with_x should return the given (two byte) address offset with the value of the X register");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indexed With Y", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBE);
  appleToo.write_memory(appleToo.PC+1, 0x1B);
  appleToo.set_register("YR", 0x01);

  equal(appleToo.absolute_indexed_with_y(), 0x1BBF, "AppleToo.absolute_indexed_with_y should return the given (two byte) address offset with the value of the Y register");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indirect", function() {
  expect(3);

  appleToo.write_memory(0x1C00, 0xAB); //65C02 Functionality
  appleToo.write_memory(0x1BFF, 0xCD);

  appleToo.write_memory(appleToo.PC, 0xFF);
  appleToo.write_memory(appleToo.PC+1, 0x1B);

  equal(appleToo.absolute_indirect(), 0xABCD, "AppleToo.absolute_indirect should return the address formed by reading the low byte at the absolute address and the high byte at the absolute address plus one");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");

  appleToo.COMPATIBILITY_MODE = true;

  appleToo.write_memory(0x1BFF, 0xCD); //Broken 6502 Functionality
  appleToo.write_memory(0x1B00, 0xAB);

  appleToo.write_memory(appleToo.PC, 0xFF);
  appleToo.write_memory(appleToo.PC+1, 0x1B);

  equal(appleToo.absolute_indirect(), 0xABCD, "Absolute Indirect should follow the original 6502 bug when we're in COMPATIBILITY_MODE");
});

test("Zero Page, Indirect, Indexed with X", function() {
  expect(2);

  appleToo.write_memory(0x00FF, 0xAB);
  appleToo.write_memory(0x00FE, 0xCD);
  appleToo.set_register("XR", 0x0E);

  appleToo.write_memory(appleToo.PC, 0xF0);

  equal(appleToo.zero_page_indirect_indexed_with_x(), 0xABCD, "AppleToo.zero_page_indirect_indexed_with_x should return the address formed by reading low byte at the zero page address plus the X register and the high byte at the zero page address plus X register plus one");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indirect, Indexed with Y", function() {
  expect(2);

  appleToo.write_memory(0x00FF, 0xAB);
  appleToo.write_memory(0x00FE, 0xCD);
  appleToo.set_register("YR", 0x0E);

  appleToo.write_memory(appleToo.PC, 0xF0);

  equal(appleToo.zero_page_indirect_indexed_with_y(), 0xABCD, "AppleToo.zero_page_indirect_indexed_with_y should return the address formed by reading low byte at the zero page address plus the Y register and the high byte at the zero page address plus Y register plus one");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

module("Load and Store", setupTeardown);
test("LDY_I", function() {
  expect(5);

  appleToo.write_memory(appleToo.PC, 0x0F);
  OPCODES[0xA0].call(appleToo);

  equal(appleToo.YR, 0x0F, "Argument should be loaded into Register Y");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A0 00", zero_flag);
  test_status_after(appleToo, "A0 FF", neg_flag);
});

test("LDY_ZP", function() {
  expect(5);

  appleToo.write_memory(0x0F, 0x11);
  appleToo.write_memory(appleToo.PC, 0x0F);

  OPCODES[0xA4].call(appleToo);
  equal(appleToo.YR, 0x11, "Value from Zero Page Memory should be loaded into Register Y");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x0F, 0x00);
  test_status_after(appleToo, "A4 0F", zero_flag);

  appleToo.write_memory(0x0F, 0xFF);
  test_status_after(appleToo, "A4 0F", neg_flag);
});

test("LDY_ZPX", function() {
  expect(5);

  appleToo.XR = 0x01;
  appleToo.write_memory(0x03, 0x0F);
  appleToo.write_memory(appleToo.PC, 0x02);

  OPCODES[0xB4].call(appleToo);
  equal(appleToo.YR, 0x0F, "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x03, 0x00);
  test_status_after(appleToo, "B4 02", zero_flag);

  appleToo.write_memory(0x03, 0xFF);
  test_status_after(appleToo, "B4 02", neg_flag);
});

test("LDY_A", function() {
  expect(5);

  appleToo.write_memory("ABCD", "11");
  appleToo.write_memory(appleToo.PC, 0xCD);
  appleToo.write_memory(appleToo.PC+1, 0xAB);

  OPCODES[0xAC].call(appleToo);
  equal(appleToo.YR, 0x11, "Value at 2-byte argument should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xABCD, 0x00);
  test_status_after(appleToo, "AC CD AB", zero_flag);

  appleToo.write_memory(0xABCD, 0xFF);
  test_status_after(appleToo, "AC CD AB", neg_flag);
});

test("LDY_AX", function() {
  expect(5);

  appleToo.write_memory(0xAABB, 0x11);
  appleToo.XR = 0xBB;
  appleToo.write_memory(appleToo.PC, 0x00);
  appleToo.write_memory(appleToo.PC+1, 0xAA);

  OPCODES[0xBC].call(appleToo);
  equal(appleToo.YR, 0x11, "Value at memory location (absolute arg + value at Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xAABB, 0x00);
  test_status_after(appleToo, "BC 00 AA", zero_flag);

  appleToo.write_memory(0xAABB, 0xFF);
  test_status_after(appleToo, "BC 00 AA", neg_flag);
});

test("LDX_I", function() {
  expect(5);

  appleToo.write_memory(appleToo.PC, 0x11);

  OPCODES[0xA2].call(appleToo);
  equal(appleToo.XR, 0x11, "Argument should be loaded into Register X");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A2 00", zero_flag);
  test_status_after(appleToo, "A2 FF", neg_flag);
});

test("LDX_ZP", function() {
  expect(5);

  appleToo.write_memory(0x0F, 0x11);
  appleToo.write_memory(appleToo.PC, 0x0F);

  OPCODES[0xA6].call(appleToo);
  equal(appleToo.XR, 0x11, "Value from Zero Page Memory should be loaded into Register X");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x0F, 0x00);
  test_status_after(appleToo, "A6 0F", zero_flag);

  appleToo.write_memory(0x0F, 0xFF);
  test_status_after(appleToo, "A6 0F", neg_flag);
});

test("LDX_ZPY", function() {
  expect(5);

  appleToo.YR = 0x01;
  appleToo.write_memory(0x03, 0x0F);
  appleToo.write_memory(appleToo.PC, 0x02);

  OPCODES[0xB6].call(appleToo);
  equal(appleToo.XR, 0x0F, "Value at Memory location (Zero Page Arg + value in Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x03, 0x00);
  test_status_after(appleToo, "B6 02", zero_flag);

  appleToo.write_memory(0x03, 0xFF);
  test_status_after(appleToo, "B6 02", neg_flag);
});

test("LDX_A", function() {
  expect(5);

  appleToo.write_memory(0xABCD, 0x11);
  appleToo.write_memory(appleToo.PC, 0xCD);
  appleToo.write_memory(appleToo.PC+1, 0xAB);

  OPCODES[0xAE].call(appleToo);
  equal(appleToo.XR, 0x11, "Value at 2-byte argument should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xABCD, 0x00);
  test_status_after(appleToo, "AE CD AB", zero_flag);

  appleToo.write_memory(0xABCD, 0xFF);
  test_status_after(appleToo, "AE CD AB", neg_flag);
})

test("LDX_AY", function() {
  expect(5);

  appleToo.write_memory(0xAABB, 0x11);
  appleToo.YR = 0xBB;
  appleToo.write_memory(appleToo.PC, 0x00);
  appleToo.write_memory(appleToo.PC+1, 0xAA);

  OPCODES[0xBE].call(appleToo);
  equal(appleToo.XR, 0x11, "Value at memory location (absolute arg + value at Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xAABB, 0x00);
  test_status_after(appleToo, "BE 00 AA", zero_flag);

  appleToo.write_memory(0xAABB, 0xFF);
  test_status_after(appleToo, "BE 00 AA", neg_flag);
});

test("LDA_I", function() {
  expect(5);

  appleToo.write_memory(appleToo.PC, 0x11);

  OPCODES[0xA9].call(appleToo);
  equal(appleToo.AC, 0x11, "Argument should be loaded into Accumulator");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A9 00", zero_flag);
  test_status_after(appleToo, "A9 FF", neg_flag);
});

test("LDA_ZP", function() {
  expect(5);

  appleToo.write_memory(0x0F, 0x11);
  appleToo.write_memory(appleToo.PC, 0x0F);

  OPCODES[0xA5].call(appleToo);
  equal(appleToo.AC, 0x11, "Value from Zero Page Memory should be loaded into Accumulator");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x0F, 0x00);
  test_status_after(appleToo, "A5 0F", zero_flag);

  appleToo.write_memory(0x0F, 0xFF);
  test_status_after(appleToo, "A5 0F", neg_flag);
});

test("LDA_ZPX", function() {
  expect(5);

  appleToo.XR = 0x01;
  appleToo.write_memory(0x03, 0x0F);
  appleToo.write_memory(appleToo.PC, 0x02);

  OPCODES[0xB5].call(appleToo);
  equal(appleToo.AC, 0x0F, "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0x03, 0x00);
  test_status_after(appleToo, "B5 02", zero_flag);

  appleToo.write_memory(0x03, 0xFF);
  test_status_after(appleToo, "B5 02", neg_flag);
});

test("LDA_A", function() {
  expect(5);

  appleToo.write_memory(0xABCD, 0x11);
  appleToo._write_memory(appleToo.PC, 0xABCD);
  OPCODES[0xAD].call(appleToo);

  equal(appleToo.AC, 0x11, "Value at 2-byte argument should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xABCD, 0x00);
  test_status_after(appleToo, "AD CD AB", zero_flag);

  appleToo.write_memory(0xABCD, 0xFF);
  test_status_after(appleToo, "AD CD AB", neg_flag);
})

test("LDA_AX", function() {
  expect(5);

  appleToo.write_memory(0xAABB, 0x11);
  appleToo.XR = 0xBB;
  appleToo._write_memory(appleToo.PC, 0xAA00);

  OPCODES[0xBD].call(appleToo);
  equal(appleToo.AC, 0x11, "Value at memory location (absolute arg + value at Register X) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xAABB, 0x00);
  test_status_after(appleToo, "BD 00 AA", zero_flag);

  appleToo.write_memory(0xAABB, 0xFF);
  test_status_after(appleToo, "BD 00 AA", neg_flag);
});

test("LDA_AY", function() {
  expect(5);

  appleToo.write_memory(0xAABB, 0x11);
  appleToo.YR = 0xBB;
  appleToo._write_memory(appleToo.PC, 0xAA00);

  OPCODES[0xB9].call(appleToo);
  equal(appleToo.AC, 0x11, "Value at memory location (absolute arg + value at Register Y) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xAABB, 0x00);
  test_status_after(appleToo, "B9 00 AA", zero_flag);

  appleToo.write_memory(0xAABB, 0xFF);
  test_status_after(appleToo, "B9 00 AA", neg_flag);
});

test("LDA_IDX", function() {
  expect(5);

  appleToo.write_memory(0x17, 0x10);
  appleToo.write_memory(0x18, 0xD0);
  appleToo.write_memory(0xD010, 0x11);
  appleToo.XR = 0x02;
  appleToo.write_memory(appleToo.PC, 0x15);

  OPCODES[0xA1].call(appleToo);
  equal(appleToo.AC, 0x11, "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xD010, 0x00);
  test_status_after(appleToo, "A1 15", zero_flag);

  appleToo.write_memory(0xD010, 0xFF);
  test_status_after(appleToo, "A1 15", neg_flag);
});

test("LDA_IDY", function() {
  expect(5);

  appleToo.write_memory(0x17, 0x10);
  appleToo.write_memory(0x18, 0xD0);
  appleToo.write_memory(0xD010, 0x11);
  appleToo.YR = 0x02;
  appleToo.write_memory(appleToo.PC, 0x15);

  OPCODES[0xB1].call(appleToo);
  equal(appleToo.AC, 0x11, "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory(0xD010, 0x00);
  test_status_after(appleToo, "B1 15", zero_flag);

  appleToo.write_memory(0xD010, 0xFF);
  test_status_after(appleToo, "B1 15", neg_flag);
});


test("STA_A", function() {
  expect(2);

  appleToo.AC = 0xAA;
  appleToo._write_memory(appleToo.PC, 0x1337);

  OPCODES[0x8D].call(appleToo);
  equal(appleToo._read_memory(0x1337), 0xAA, "Store Accumlator at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_AX", function() {
  expect(2);

  appleToo.AC = 0xAA;
  appleToo.XR = 0x02;
  appleToo._write_memory(appleToo.PC, 0x1335);

  OPCODES[0x9D].call(appleToo);
  equal(appleToo._read_memory(0x1337), 0xAA, "Store Accumlator at given absolute address + value in Register X");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_AY", function() {
  expect(2);

  appleToo.AC = 0xAA;
  appleToo.YR = 0x02;
  appleToo._write_memory(appleToo.PC, 0x1335);

  OPCODES[0x99].call(appleToo);
  equal(appleToo._read_memory(0x1337), 0xAA, "Store Accumlator at given absolute address + value in Register Y");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_ZP", function() {
  expect(2);

  appleToo.AC = 0xAA;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x85].call(appleToo);

  equal(appleToo._read_memory(0x01), 0xAA, "Store Accumlator at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STA_ZPX", function() {
  expect(2);

  appleToo.AC = 0xAA;
  appleToo.XR = 0x01;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x95].call(appleToo);

  equal(appleToo._read_memory(0x02), 0xAA, "Store Accumlator at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_IDX", function() {
  expect(2);

  appleToo.AC = 0xBB;
  appleToo.XR = 0x02;

  appleToo.write_memory(0x17, 0x10);
  appleToo.write_memory(0x18, 0xD0);
  appleToo.write_memory(appleToo.PC, 0x15);

  OPCODES[0x81].call(appleToo);
  equal(appleToo._read_memory(0xD010), 0xBB, "Store Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STA_IDY", function() {
  expect(2);

  appleToo.AC = 0xBB;
  appleToo.YR = 0x02;

  appleToo.write_memory(0x17, 0x10);
  appleToo.write_memory(0x18, 0xD0);
  appleToo.write_memory(appleToo.PC, 0x15);

  OPCODES[0x91].call(appleToo);

  equal(appleToo._read_memory(0xD010), 0xBB, "Store Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STX_ZP", function() {
  expect(2);

  appleToo.XR = 0xAA;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x86].call(appleToo);

  equal(appleToo._read_memory(0x01), 0xAA, "Store Register X at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STX_ZPY", function() {
  expect(2);

  appleToo.XR = 0xAA;
  appleToo.YR = 0x01;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x96].call(appleToo);

  equal(appleToo._read_memory(0x02), 0xAA, "Store Register X at (Zero Page Memory Location + value in Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STX_A", function() {
  expect(2);

  appleToo.XR = 0xAA;
  appleToo._write_memory(appleToo.PC, 0x1337);

  OPCODES[0x8E].call(appleToo);
  equal(appleToo._read_memory(0x1337), 0xAA, "Store Register X at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_ZP", function() {
  expect(2);

  appleToo.YR = 0xAA;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x84].call(appleToo);

  equal(appleToo._read_memory(0x01), 0xAA, "Store Register Y at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STY_ZPX", function() {
  expect(2);

  appleToo.YR = 0xAA;
  appleToo.XR = 0x01;
  appleToo.write_memory(appleToo.PC, 0x01);

  OPCODES[0x94].call(appleToo);

  equal(appleToo._read_memory(0x02), 0xAA, "Store Register Y at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_A", function() {
  expect(2);

  appleToo.YR = 0xAA;
  appleToo._write_memory(appleToo.PC, 0x1337);

  OPCODES[0x8C].call(appleToo);
  equal(appleToo._read_memory(0x1337), 0xAA, "Store Register Y at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

module("Arithmetic", setupTeardown);

test("ADC", function() {
  expect(12);

  appleToo.AC = 0x02;
  appleToo.adc(0x11);

  equal(appleToo.AC, 0x13, "Value should be added to accumulator");
  deepEqual(appleToo.get_status_flags(), unset_flags);

  appleToo.AC = 0x01;
  appleToo.SR = SR_FLAGS.C;
  appleToo.adc(0x01);

  equal(appleToo.AC, 0x03, "ADC should take into account the carry flag");
  deepEqual(appleToo.get_status_flags(), unset_flags, "Carry flag should be cleared");

  appleToo.SR = SR_FLAGS.D;
  appleToo.AC = to_bcd(30);
  appleToo.adc(to_bcd(20));

  equal(appleToo.AC, to_bcd(50), "ADC should correctly handle BCD");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.AC = to_bcd(35);
  appleToo.SR = SR_FLAGS.C + SR_FLAGS.D;
  appleToo.adc(to_bcd(20));

  equal(appleToo.AC, to_bcd(56), "ADC should correctly handle BCD with Carry");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x00;
  appleToo.adc(0x00);

  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.AC = 0xB0;
  appleToo.adc(0x02);

  deepEqual(appleToo.get_status_flags(), neg_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x02;
  appleToo.adc(0xFF);

  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x7F;
  appleToo.adc(0x01);

  deepEqual(appleToo.get_status_flags(), overflow_neg_flag);
});

/*test("SBC", function() {
  expect(12);

  appleToo.AC = 0x11;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 0x0F, "Value at address should be subtracted from accumulator");
  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.AC = 0x03;
  appleToo.set_status_flags({"C":1});
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 0x01, "SBC should take into account the carry flag");
  deepEqual(appleToo.get_status_flags(), unset_flags, "Carry flag should be cleared");

  appleToo.SR = 0;
  appleToo.AC = 10;
  appleToo.write_memory(0xABCD, 5);
  appleToo.set_status_flags({D:1});
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 4, "SBC should correctly handle BCD");
  deepEqual(appleToo.get_status_flags(), dec_carry_flag);

  appleToo.AC = 10;
  appleToo.set_status_flags({C:1, D:1});
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 5, "SBC should correctly handle BCD with Carry");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.SR = 0;
  appleToo.set_status_flags({C:1});
  appleToo.AC = 0x00;
  appleToo.sbc(0xFFFF);

  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x01;
  appleToo.write_memory(0xABCD, 0x02);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), neg_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x02;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.SR = 0;
  appleToo.set_status_flags({C:1});
  appleToo.AC = 0x80;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), overflow_carry_flag);
});*/

module("Increment and Decrement", setupTeardown);

test("Inc/dec register", function() {
  expect(5);

  appleToo.SR = 0;
  appleToo.XR = 0;
  appleToo.inc_dec_register("XR", 1);
  equal(appleToo.XR, 1, "Should increment register by 1");
  deepEqual(appleToo.get_status_flags(), unset_flags);

  appleToo.SR = 0;
  appleToo.XR = 1;
  appleToo.inc_dec_register("XR", -1);
  equal(appleToo.XR, 0, "Should decrement register by 1");
  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.XR = 0;
  appleToo.inc_dec_register("XR", -1);
  deepEqual(appleToo.get_status_flags(), neg_flag);
});

test("Inc/dec memory", function() {
  expect(2);

  appleToo.write_memory(0xABCD, 0x01);
  appleToo.inc_dec_memory(0xABCD, 1);
  equal(appleToo._read_memory(0xABCD), 2, "Should increment value at addr by 1");

  appleToo.write_memory(0xABCD, 0x01);
  appleToo.inc_dec_memory(0xABCD, -1);
  equal(appleToo._read_memory(0xABCD), 0, "Should decrement value at addr by 1");
});

module("Set and Clear", setupTeardown);
test("Set Flag", function(){
  expect(8);

  appleToo.SR = 1;
  appleToo.set_flag("N");
  equal(appleToo.SR, 129, "set_flag shouldn't clober flags");

  appleToo.SR = 0;
  appleToo.set_flag("N");
  equal(appleToo.SR, 128);

  appleToo.SR = 0;
  appleToo.set_flag("V");
  equal(appleToo.SR, 64);

  appleToo.SR = 0;
  appleToo.set_flag("B");
  equal(appleToo.SR, 16);

  appleToo.SR = 0;
  appleToo.set_flag("D");
  equal(appleToo.SR, 8);

  appleToo.SR = 0;
  appleToo.set_flag("I");
  equal(appleToo.SR, 4);

  appleToo.SR = 0;
  appleToo.set_flag("Z");
  equal(appleToo.SR, 2);

  appleToo.SR = 0;
  appleToo.set_flag("C");
  equal(appleToo.SR, 1);
});
test("Clear Flag", function() {
  expect(1);

  appleToo.SR = 3;
  appleToo.clear_flag("C");

  equal(appleToo.SR, 2);
});

module("Stack", setupTeardown);
test("Push", function() {
  expect(4);

  equal(appleToo.SP, 0xFF, "Stack pointer should be properly initialized");

  appleToo.push(0xAA);
  equal(appleToo.SP, 0xFE, "Push should decrement the stack pointer by one");
  equal(appleToo._read_memory(0x01FF), 0xAA, "Value should be on the stack");

  appleToo.SP = 0x00;
  appleToo.push(0xAA);
  equal(appleToo.SP, 0xFF, "Stack should wrap around on overflow");
});

test("Pop", function() {
  expect(2);

  appleToo.write_memory(0x01FF, 0xAA);
  appleToo.SP = 0xFE;

  appleToo.pop("AC");
  equal(appleToo.AC, 0xAA, "Value from top of stack should be returned");
  equal(appleToo.SP, 0xFF, "Stack Pointer should be incremented");
});

module("Transfer", setupTeardown);
test("transfer_register", function() {
  appleToo.SR = 0;
  appleToo.AC = 0x00;
  appleToo.transfer_register("AC", "XR");

  equal(appleToo.XR, 0x00, "Accumulator should be transfered to X");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  equal(appleToo.PC, 0xC001, "PC should be incremented by one");
  deepEqual(appleToo.get_status_flags(), zero_flag, "Zero flag should be set");

  appleToo.SR = 0;
  appleToo.AC = 0xB0;
  appleToo.transfer_register("AC", "XR");

  deepEqual(appleToo.get_status_flags(), neg_flag, "Neg flag should be set");
});
test("TAX", function() {
  expect(1);

  appleToo.AC = 0xAA;
  OPCODES[0xAA].call(appleToo);
  equal(appleToo.XR, 0xAA, "Accumulator should be transfered to X");
});
test("TXA", function() {
  expect(1);

  appleToo.XR = 0xAA;
  OPCODES[0x8A].call(appleToo);
  equal(appleToo.AC, 0xAA, "X should be transfered to Accumulator");
});
test("TAY", function() {
  expect(1);

  appleToo.AC = 0xAA;
  OPCODES[0xA8].call(appleToo);
  equal(appleToo.YR, 0xAA, "Accumulator should be transfered to Y");
});
test("TYA", function() {
  expect(1);

  appleToo.YR = 0xAA;
  OPCODES[0x98].call(appleToo);
  equal(appleToo.AC, 0xAA, "Y should be transfered to Accumulator");
});
test("TSX", function() {
  expect(1);

  appleToo.SP = 0xAA;
  OPCODES[0xBA].call(appleToo);
  equal(appleToo.XR, 0xAA, "SP should be transfered to X");
});
test("TXS", function() {
  expect(1);

  appleToo.XR = 0x0100;
  OPCODES[0x9A].call(appleToo);
  equal(appleToo.SP, 0x0100, "X should be transfered to SP");
});

module("Logic", setupTeardown);
test("logic_op", function() {
  expect(6);

  appleToo.SR = 0;
  appleToo.AC = 0x01;
  appleToo.write_memory(0xABCD, 0x03);
  appleToo.logic_op("AND", 0xABCD);

  equal(appleToo.AC, 0x01, "Value in memory should be ANDed with AC and put in AC");
  deepEqual(appleToo.get_status_flags(), unset_flags);

  appleToo.SR = 0;
  appleToo.AC = 0xB0;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.logic_op("ORA", 0xABCD);

  equal(appleToo.AC, 0xB1, "Value in memory should be ORed with AC and put in AC");
  deepEqual(appleToo.get_status_flags(), neg_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x01;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.logic_op("EOR", 0xABCD);

  equal(appleToo.AC, 0x00, "Value in memory should be XORed with AC and put in AC");
  deepEqual(appleToo.get_status_flags(), zero_flag);
});

module("Subroutines and Jump", setupTeardown);
test("Jump", function() {
  expect(1);

  appleToo.jump(0xABCD);
  equal(appleToo.PC, 0xABCD, "Jump should correctly set the PC");
});
test("JSR", function() {
  expect(3);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0xCD);
  appleToo.write_memory(appleToo.PC+1, 0xAB);

  OPCODES[0x20].call(appleToo);

  equal(appleToo.PC, 0xABCD, "Program counter should be correctly set");
  equal(appleToo.pop_word(), original_PC+1, "PC should be stored on the stack");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});
test("RTS", function() {
  expect(2);
  appleToo.push_word(0xABCD - 1); // JSR will have pushed the previous PC - 1

  OPCODES[0x60].call(appleToo);

  equal(appleToo.PC, 0xABCD, "Program counter should be correctly set");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});
test("RTI", function() {
  expect(3);
  appleToo.push_word(0xABCD); // Interrupt will have pushed the previous PC
  appleToo.push(0x03); // Interrupt will have pushed previous SR

  OPCODES[0x40].call(appleToo);

  equal(appleToo.PC, 0xABCD, "Program counter should be correctly set");
  equal(appleToo.SR, 0x03, "SR should be pulled from stack");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

module("Branch", setupTeardown);
// TODO Handle cycles correctly (depends on page boundaries:
// http://e-tradition.net/bytes/6502/6502_instruction_set.html)
test("BCC", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = 0;

  OPCODES[0x90].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since carry is clear");

  appleToo.PC = original_PC;
  appleToo.SR = SR_FLAGS.C;

  OPCODES[0x90].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since carry is set");
});
test("BCS", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = SR_FLAGS.C;

  OPCODES[0xB0].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since carry is set");

  appleToo.PC = original_PC;
  appleToo.SR = 0;

  OPCODES[0xB0].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since carry is clear");
});
test("BEQ", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = SR_FLAGS.Z;

  OPCODES[0xF0].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since zero is set");

  appleToo.PC = original_PC;
  appleToo.SR = 0;

  OPCODES[0xF0].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since zero is clear");
});
test("BNE", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = 0;

  OPCODES[0xD0].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since zero is clear");

  appleToo.PC = original_PC;
  appleToo.SR = SR_FLAGS.Z;

  OPCODES[0xD0].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since zero is set");
});
test("BMI", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = SR_FLAGS.N;

  OPCODES[0x30].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since negative is set");

  appleToo.PC = original_PC;
  appleToo.SR = 0;

  OPCODES[0x30].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since negative is clear");
});
test("BPL", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = 0;

  OPCODES[0x10].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since negative is clear");

  appleToo.PC = original_PC;
  appleToo.SR = SR_FLAGS.N;

  OPCODES[0x10].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since negative is set");
});
test("BVC", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = 0;

  OPCODES[0x50].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since overflow is clear");

  appleToo.PC = original_PC;
  appleToo.SR = SR_FLAGS.V;

  OPCODES[0x50].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since overflow is set");
});
test("BVS", function() {
  expect(2);
  var original_PC = appleToo.PC;
  appleToo.write_memory(appleToo.PC, 0x04);
  appleToo.SR = SR_FLAGS.V;

  OPCODES[0x70].call(appleToo);

  equal(appleToo.PC, original_PC+0x04, "Should branch since overflow is set");

  appleToo.PC = original_PC;
  appleToo.SR = 0;

  OPCODES[0x70].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should not branch since overflow is clear");
});

module("Misc", setupTeardown);
test("NOP", function() {
  expect(1);
  var original_PC = appleToo.PC;

  OPCODES[0xEA].call(appleToo);

  equal(appleToo.PC, original_PC+1, "Should increment the PC");
});
test("BRK", function() {
  expect(4);

  var original_PC = appleToo.PC;
  appleToo.write_memory(0xFFFF, 0xAB); // High byte
  appleToo.write_memory(0xFFFE, 0xCD); // Low byte

  OPCODES[0x00].call(appleToo);

  equal(appleToo.PC, 0xABCD, "PC should be set to value at IRQ/BRK vector address");
  equal(appleToo.pop(), SR_FLAGS.I + SR_FLAGS.B, "SR should be stored on the stack");
  equal(appleToo.pop_word(), original_PC+1, "PC+1 should be stored on the stack");
  equal(appleToo.cycles, 7, "Should take 7 cycles");
});

module("Shift and Rotate", setupTeardown);
test("ASL", function() {
  expect(4);

  appleToo.AC = 0xCC; // 0b11001100

  appleToo.shift("left");

  equal(appleToo.AC, 0x98, "Should shift AC left one bit"); //0b10011000
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");

  appleToo.SR = 0;
  appleToo.write_memory(0xABCD, 0xCC);

  appleToo.shift("left", 0xABCD);

  equal(appleToo._read_memory(0xABCD), 0x98, "Should shift memory left one bit");
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");
});
test("LSR", function() {
  expect(4);

  appleToo.AC = 0xCD; // 0b11001101

  appleToo.shift("right");

  equal(appleToo.AC, 0x66, "Should shift AC right one bit");
  deepEqual(appleToo.get_status_flags(), carry_flag, "Carry flag should be set");

  appleToo.SR = 0;
  appleToo.write_memory(0xABCD, 0xCD);

  appleToo.shift("right", 0xABCD);

  equal(appleToo._read_memory(0xABCD), 0x66, "Should shift memory right one bit");
  deepEqual(appleToo.get_status_flags(), carry_flag, "Carry flag should be set");
});
test("ROR", function() {
  expect(4);

  appleToo.AC = 0xCD; // 0b11001101
  appleToo.SR = SR_FLAGS.C;

  appleToo.rotate("right");

  equal(appleToo.AC, 0xE6, "Should rotate AC one bit right using carry");
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");

  appleToo.write_memory(0xABCD, 0xCD); // 0b11001101
  appleToo.SR = SR_FLAGS.C;

  appleToo.rotate("right", 0xABCD);

  equal(appleToo._read_memory(0xABCD), 0xE6, "Should rotate memory one bit right using carry");
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");
});
test("ROL", function() {
  expect(4);

  appleToo.AC = 0xCC; // 0b11001100
  appleToo.SR = SR_FLAGS.C;

  appleToo.rotate("left");

  equal(appleToo.AC, 0x99, "Should rotate AC left one bit using carry"); //0b10011001
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");

  appleToo.SR = SR_FLAGS.C;
  appleToo.write_memory(0xABCD, 0xCC);

  appleToo.rotate("left", 0xABCD);

  equal(appleToo._read_memory(0xABCD), 0x99, "Should rotate memory left one bit using carry");
  deepEqual(appleToo.get_status_flags(), carry_neg_flag, "Carry and Negative flags should be set");
});

module("Compare and Test Bit", setupTeardown);
test("CMP", function() {
  expect(2);
  appleToo.AC = 0x05;

  appleToo.compare("AC", 0x01);

  deepEqual(appleToo.get_status_flags(), carry_flag, "Carry flag should be set");

  appleToo.compare("AC", 0x10);

  deepEqual(appleToo.get_status_flags(), neg_flag, "Negative flag should be set");
});
test("BIT", function() {
  expect(2);

  appleToo.AC = 0x0F; //0b00001111

  appleToo.bit(0xC1); //0b11000001

  deepEqual(appleToo.get_status_flags(), overflow_neg_flag, "Overflow and Negative flags should be set based on operand");

  appleToo.SR = 0;

  appleToo.AC = 0x0F;
  appleToo.bit(0x30); //0b11110000
  deepEqual(appleToo.get_status_flags(), zero_flag, "Zero flag should be set based on result");
});
// vim: expandtab:ts=2:sw=2
