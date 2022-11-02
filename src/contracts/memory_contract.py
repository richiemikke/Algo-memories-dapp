from pyteal import *


class Memory:
    class Variables:
        description = Bytes("DESCRIPTION")
        helpfull = Bytes("HELPFULL")
        nothelpfull = Bytes("NOTHELPFULL")
        owner = Bytes("OWNER")

    class AppMethods:
        helpfull = Bytes("helpfull")
        nothelpfull = Bytes("nothelpfull")
        editmemory = Bytes("editmemory")

    # this function creates a new memory

    def application_creation(self):
        return Seq([
            Assert(
                And(
                    Txn.application_args.length() == Int(1),
                    Txn.note() == Bytes("memories:uv4.6"),
                    Len(Txn.application_args[0]) > Int(0),
                )
            ),
            App.globalPut(self.Variables.description, Txn.application_args[0]),
            App.globalPut(self.Variables.helpfull, Int(0)),
            App.globalPut(self.Variables.nothelpfull, Int(0)),
            App.globalPut(self.Variables.owner, Txn.sender()),
            Approve(),
        ])

    # helpfull

    def helpfull(self):
        Assert(
            And(
                Txn.sender() != App.globalGet(self.Variables.owner),
                Txn.application_args.length() == Int(1),
            ),
        ),
        return Seq([
            App.globalPut(self.Variables.helpfull, App.globalGet(
                self.Variables.helpfull) + Int(1)),
            Approve()
        ])

        # nothelpful
    def nothelpfull(self):
        Assert(
            And(
                Txn.sender() != Global.creator_address(),
                Txn.application_args.length() == Int(1),
            ),
        ),
        return Seq([
            App.globalPut(self.Variables.nothelpfull, App.globalGet(
                self.Variables.nothelpfull) + Int(1)),
            Approve()
        ])

    # editing the memory and only the owner of the memory can do this

    def editmemory(self):
        Assert(
            And(
                Global.group_size() == Int(1),
                Txn.sender() == App.globalGet(self.Variables.owner),
                Txn.application_args.length() == Int(2),
            ),
        ),
        return Seq([
            App.globalPut(self.Variables.description, Txn.application_args[1]),
            Approve()
        ])

    # deleting a memory from the block-chain
    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    # Check transaction conditions
    def application_start(self):
        return Cond(
            # checks if the application_id field of a transaction matches 0.
            # If this is the case, the application does not exist yet, and the application_creation() method is called
            [Txn.application_id() == Int(0), self.application_creation()],
            # If the the OnComplete action of the transaction is DeleteApplication, the application_deletion() method is called
            [Txn.on_completion() == OnComplete.DeleteApplication,
             self.application_deletion()],
            # if the first argument of the transaction matches the AppMethods.buy value, the buy() method is called.
            [Txn.application_args[0] == self.AppMethods.helpfull, self.helpfull()],
            [Txn.application_args[0] == self.AppMethods.nothelpfull, self.nothelpfull()],
            [Txn.application_args[0] == self.AppMethods.editmemory, self.editmemory()],
        )

    # The approval program is responsible for processing all application calls to the contract.
    def approval_program(self):
        return self.application_start()

    # The clear program is used to handle accounts using the clear call to remove the smart contract from their balance record.
    def clear_program(self):
        return Return(Int(1))
