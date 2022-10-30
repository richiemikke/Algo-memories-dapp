from pyteal import *

from memory_contract import Memory

if __name__ == "__main__":
    approval_program = Memory().approval_program()
    clear_program = Memory().clear_program()

    # Mode.Application specifies that this is a smart contract
    compiled_approval = compileTeal(approval_program, Mode.Application, version=6)
    print(compiled_approval)
    with open("memory_contract_approval.teal", "w") as teal:
        teal.write(compiled_approval)
        teal.close()

    # Mode.Application specifies that this is a smart contract
    compiled_clear = compileTeal(clear_program, Mode.Application, version=6)
    print(compiled_clear)
    with open("memory_contract_clear.teal", "w") as teal:
        teal.write(compiled_clear)
        teal.close()
