from pyteal import *


class Memory:
    class Variables:
        description = Bytes("DESCRIPTION") 
        helpful = Bytes("HELPFUL") 
        nothelpful = Bytes("NOTHELPFUL")
        sharedOpinion = Bytes("SHAREDOPINION")
        

    class AppMethods:
        helpful = Bytes("helpful")
        nothelpful = Bytes("nothelpful")
        editmemory = Bytes("editmemory")
       


    # this function creates a new memory
    def application_creation(self):
        return Seq([
            # checks if input data for description is a valid value
            Assert(
                And(
                    Txn.application_args.length() == Int(1),
                    Txn.note() == Bytes("memories:uv3"),
                    Len(Txn.application_args[0]) > Int(0),
                )
            ), 
            App.globalPut(self.Variables.description, Txn.application_args[0]),
            App.globalPut(self.Variables.helpful, Int(0)),
            App.globalPut(self.Variables.nothelpful, Int(0)),
            Approve(),
        ])

    # runs for opt-in transaction
    def setValues(self):
        return Seq([
            App.localPut(Txn.sender(), self.Variables.sharedOpinion, Int(0)),
            Approve()
        ])

    # review a memory as helpful
    def helpful(self):
        Assert(
            And(
                    # checks that sender is opted in
                    # checks that sender is not the creator of the application
                    # checks that sender hasn't shared his opinion about this memory yet
                    App.optedIn(Txn.sender(), Global.current_application_id()),
                    Txn.sender() != Global.creator_address(),
                    Txn.application_args.length() == Int(1),
                    App.localGet(Txn.sender(), self.Variables.sharedOpinion) == Int(0)
            ),
        ),
        return Seq([
            App.localPut(Txn.sender(), self.Variables.sharedOpinion, Int(1)),
            App.globalPut(self.Variables.helpful, App.globalGet(self.Variables.helpful) + Int(1)),
            Approve()
        ])

    # review a memory as not being helpful
    def nothelpful(self):
        Assert(
            And(
                    # checks that sender is opted in
                    # checks that sender is not the creator of the application
                    # checks that sender hasn't shared his opinion about this memory yet
                    App.optedIn(Txn.sender(), Global.current_application_id()),
                    Txn.sender() != Global.creator_address(),
                    Txn.application_args.length() == Int(1),
                    App.localGet(Txn.sender(), self.Variables.sharedOpinion) == Int(0)
            ),
        ),
        return Seq([
            App.localPut(Txn.sender(), self.Variables.sharedOpinion, Int(1)),
            App.globalPut(self.Variables.nothelpful, App.globalGet(self.Variables.nothelpful) + Int(1)),
            Approve()
        ])


   

    # editing the memory and only the owner of the memory can do this
    def editmemory(self):
        Assert(
            And(
                    Txn.sender() == Global.creator_address(),
                    Txn.applications.length() == Int(1),
                    Txn.application_args.length() == Int(2),
                    Len(Txn.application_args[1]) > Int(0)
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
            [Txn.on_completion() == OnComplete.OptIn, self.setValues()],
            [Txn.application_args[0] == self.AppMethods.helpful, self.helpful()],
            [Txn.application_args[0] == self.AppMethods.nothelpful, self.nothelpful()],
            [Txn.application_args[0] == self.AppMethods.editmemory, self.editmemory()],
        )

    # The approval program is responsible for processing all application calls to the contract.
    def approval_program(self):
        return self.application_start()

    # The clear program is used to handle accounts using the clear call to remove the smart contract from their balance record.
    def clear_program(self):
        return Return(Int(1))
