import React, {
    useEffect,
    useState
} from "react";
import {
    toast
} from "react-toastify";
import AddMemory from "./AddMemory";
import Memory from "./Memory";
import Loader from "../utils/Loader";
import {
    NotificationError,
    NotificationSuccess
} from "../utils/Notifications";
import {
    createMemoryAction,
    helpfullAction,
    nothelpfullAction,
    editAction,
    deleteMemoryAction,
    getMemoriesAction,
} from "../../utils/marketplace";
import PropTypes from "prop-types";
import {
    Row
} from "react-bootstrap";

const Memories = ({
    address,
    fetchBalance
}) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(false);

    const getMemories = async () => {
        setLoading(true);
        getMemoriesAction()
            .then(memories => {
                if (memories) {
                    setMemories(memories);
                }
            })
            .catch(error => {
                console.log(error);
            })
            .finally(_ => {
                setLoading(false);
            });
    };

    useEffect(() => {
        getMemories();
    }, []);

    const createMemory = async (data) => {
        setLoading(true);
        createMemoryAction(address, data)
            .then(() => {
                toast( < NotificationSuccess text = "Memory has been added to the block-chain successfully." / > );
                getMemories();
                fetchBalance(address);
            })
            .catch(error => {
                console.log(error);
                toast( < NotificationError text = "Failed to add memory to the block-chain." / > );
                setLoading(false);
            })
    };


    const Helpfull = async (memory) => {
        setLoading(true);
        helpfullAction(address, memory)
            .then(() => {
                toast( < NotificationSuccess text = "Helpfullness activated successfully" / > );
                getMemories();
                fetchBalance(address);
            })
            .catch(error => {
                console.log(error)
                toast( < NotificationError text = "Failed to activate helpfullness." / > );
                setLoading(false);
            })
    };


    const notHelpfull = async (memory) => {
        setLoading(true);
        nothelpfullAction(address, memory)
            .then(() => {
                toast( < NotificationSuccess text = "NotHelpfull activated successfully" / > );
                getMemories();
                fetchBalance(address);
            })
            .catch(error => {
                console.log(error)
                toast( < NotificationError text = "Failed to activate Nothelpfull." / > );
                setLoading(false);
            })
    };


    const editMemory = async (memory, description) => {
        setLoading(true);
        editAction(address, memory, description)
            .then(() => {
                toast( < NotificationSuccess text = "memory edited successfully" / > );
                getMemories();
                fetchBalance(address);
            })
            .catch(error => {
                console.log(error)
                toast( < NotificationError text = "failed to edit memory." / > );
                setLoading(false);
            })
    };




    const deleteMemory = async (memory) => {
        setLoading(true);
        deleteMemoryAction(address, memory.appId)
            .then(() => {
                toast( < NotificationSuccess text = " memory has been succesfully deleted from the block-chain." / > );
                getMemories();
                fetchBalance(address);
            })
            .catch(error => {
                console.log(error)
                toast( < NotificationError text = "Failed to delete memory." / > );
                setLoading(false);
            })
    };

    if (loading) {
        return <Loader / > ;
    }
    return ( <
        >
        <
        div className = "d-flex justify-content-between align-items-center mb-4" >
        <
        h1 className = "fs-4 fw-bold mb-0" > Memory Dapp < /h1> <
        AddMemory createMemory = {
            createMemory
        }
        /> <
        /div> <
        Row xs = {
            1
        }
        sm = {
            2
        }
        lg = {
            3
        }
        className = "g-3 mb-5 g-xl-4 g-xxl-5" >
        <
        > {
            memories.map((data, index) => ( <
                Memory address = {
                    address
                }
                memory = {
                    data
                }
                Helpfull = {
                    Helpfull
                }
                notHelpfull = {
                    notHelpfull
                }
                editMemory = {
                    editMemory
                }
                deleteMemory = {
                    deleteMemory
                }
                key = {
                    index
                }
                />
            ))
        } <
        /> <
        /Row> <
        />
    );
};

Memories.propTypes = {
    address: PropTypes.string.isRequired,
    fetchBalance: PropTypes.func.isRequired
};

export default Memories;