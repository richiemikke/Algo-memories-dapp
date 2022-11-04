from pyteal import *
from util import convert_uint_to_bytes


class Memory:
    class Variables:  # 2 global ints and 8 global bytes
        helpful = Bytes("HELPFUL")  # uints
        nothelpful = Bytes("NOTHELPFUL")  # uints
        # for the content we'll fill up the 7 key value pairs with 127 bytes each using key indexes 0 - 7,  as we're only allowed 128 bytes per key value pair
        # this increases the blog content by 889 bytes, we can't go higher than this on app creation as doing so will return the dynamic cost budget exceeded error as on app creation local program cost max is 700 and this exceeds it

    class Local_Variables:
        feedback = Bytes("FEEDBACK")  # uint, 2 - helpful, 1 - not helpful

    class AppMethods:
        give_feedback = Bytes("feedback")
        edit_memory = Bytes("editmemory")

    # stores the description of the memory in the global state
    @Subroutine(TealType.none)
    def store_description(blog_data: Expr):
        counter = ScratchVar(TealType.uint64)
        length_of_bytes = ScratchVar(TealType.uint64)
        length_of_bytes_to_store = ScratchVar(TealType.uint64)
        starting_index = ScratchVar(TealType.uint64)
        current_bytes = ScratchVar(TealType.bytes)
        key_index = ScratchVar(TealType.bytes)
        return Seq([
            length_of_bytes.store(Len(blog_data)),

            # iterate through indexes from 0 - 7
            For(
                counter.store(Int(0)), counter.load() < Int(
                    8), counter.store(counter.load() + Int(1))
            ).Do(

                # convert index to string
                key_index.store(convert_uint_to_bytes(counter.load())),

                # store starting index
                starting_index.store(Int(127) * counter.load()),

                # if length of bytes is equal to zero
                If(length_of_bytes.load() == Int(0))
                .Then(
                    # break out of loop
                    Break()
                )
                # else if remaining length of blog data bytes is greater than 127.
                .ElseIf(length_of_bytes.load() > Int(127))
                .Then(
                    Seq([
                        # reduce bytes length by 125
                        length_of_bytes.store(
                            length_of_bytes.load() - Int(127)),

                        # store the length of bytes to store
                        length_of_bytes_to_store.store(Int(127)),
                    ])
                ) .Else(
                    # store the length of bytes left to store
                    length_of_bytes_to_store.store(length_of_bytes.load()),

                    # update length_of_bytes
                    length_of_bytes.store(
                        length_of_bytes.load() - length_of_bytes_to_store.load())
                ),

                # Extract bytes from blog_data
                current_bytes.store(
                    Extract(blog_data, starting_index.load(), length_of_bytes_to_store.load())),

                # Store bytes in global state
                App.globalPut(key_index.load(), current_bytes.load())
            )
        ])

    # this function creates a new memory
    def application_creation(self):
        return Seq([
            Assert(
                And(
                    Txn.application_args.length() == Int(1),
                    Txn.note() == Bytes("memories:uv5.1"),
                    Len(Txn.application_args[0]) > Int(0),
                )
            ),
            # store txn arguments in global state
            self.store_description(Txn.application_args[0]),
            App.globalPut(self.Variables.helpful, Int(0)),
            App.globalPut(self.Variables.nothelpful, Int(0)),
            Approve(),
        ])

    # opt in txn
    def opt_in(self):
        return Seq([
            # set user feedback to neutral
            App.localPut(
                Txn.accounts[0],
                self.Local_Variables.feedback,
                Int(0)
            ),
            Approve()
        ])

    # mark memory as helpful
    def helpful(self):
        user_feedback = App.localGet(
            Txn.accounts[0], self.Local_Variables.feedback)
        return Seq([
            Assert(
                # Checks
                # that user is not owner
                # that user had opted in
                # that user feedback is not already set to helpful
                And(
                    Txn.sender() != Global.creator_address(),
                    App.optedIn(Txn.accounts[0], Txn.applications[0]),
                    user_feedback != Int(2)
                )
            ),
            # increment helpful feedback
            App.globalPut(self.Variables.helpful, App.globalGet(
                self.Variables.helpful) + Int(1)),

            # if user feedback was set to not helpful, decrement not-helpful feedback count
            If(user_feedback == Int(1),
               App.globalPut(
                self.Variables.nothelpful,
                App.globalGet(self.Variables.nothelpful) - Int(1)),
               ),

            # set user feedback is set to helpful
            App.localPut(
                Txn.accounts[0],
                self.Local_Variables.feedback,
                Int(2)
            ),
            Approve()
        ])

    # mark memory as nothelpful
    def nothelpful(self):
        user_feedback = App.localGet(
            Txn.accounts[0], self.Local_Variables.feedback)
        return Seq([
            Assert(
                # Checks
                # that user is not owner
                # that user had opted in
                # that user feedback is not already set to not-helpful
                And(
                    Txn.sender() != Global.creator_address(),
                    App.optedIn(Txn.accounts[0], Txn.applications[0]),
                    user_feedback != Int(1),
                )
            ),
            # increment not helpful feedback
            App.globalPut(self.Variables.nothelpful, App.globalGet(
                self.Variables.nothelpful) + Int(1)),

            # if user feedback was set to helpful, decrement helpful feedback count
            If(user_feedback == Int(2),
               App.globalPut(
                self.Variables.helpful,
                App.globalGet(self.Variables.helpful) - Int(1)),
               ),

            # set user feedback to not helpful
            App.localPut(
                Txn.accounts[0],
                self.Local_Variables.feedback,
                Int(1)
            ),

            Approve()
        ])

    # send feedback
    def give_feedback(self):
        # if user sends 0 they mark the memory as not helpful, but if they send 1 they mark it as helpful
        return Cond(
            [Btoi(Txn.application_args[1]) == Int(1), self.helpful()],
            [Btoi(Txn.application_args[1]) == Int(0), self.nothelpful()],
        )

    # deleting a memory from the block-chain
    def application_deletion(self):
        return Return(Txn.sender() == Global.creator_address())

    # Check transaction conditions
    def application_start(self):
        return Cond(
            [Txn.application_id() == Int(0), self.application_creation()],
            [Txn.on_completion() == OnComplete.DeleteApplication,
             self.application_deletion()],
            [Txn.on_completion() == OnComplete.OptIn, self.opt_in()],
            [Txn.application_args[0] == self.AppMethods.give_feedback, self.give_feedback()],
        )

    def approval_program(self):
        return self.application_start()

    def clear_program(self):
        return Return(Int(1))
