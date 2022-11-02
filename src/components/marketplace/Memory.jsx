import React, { useState } from "react";
import PropTypes from "prop-types";
import { Badge, Button, Card, Col, FloatingLabel, Form, Stack } from "react-bootstrap";
import { microAlgosToString, truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";
import { stringToMicroAlgos } from "../../utils/conversions";

const Memory = ({ address, memory, Helpfull, notHelpfull, editMemory, deleteMemory, }) => {
    const { description, helpfull, nothelpfull, appId, owner } = memory;


    const [newdescription, setNewDescription] = useState("");

    return (
        <Col key={appId}>
            <Card className="h-100">
                <Card.Header>
                    <Stack direction="horizontal" gap={2}>
                        <span className="font-monospace text-secondary">{truncateAddress(owner)}</span>
                        <Identicon size={28} address={owner} />

                    </Stack>
                </Card.Header>

                <Card.Body className="d-flex flex-column text-center">
                    <Card.Text className="flex-grow-1">{description}</Card.Text>
                    <Badge bg="secondary" className="ms-auto">
                        {helpfull} people finds this helpfull
                    </Badge>

                    <Badge bg="secondary" className="ms-auto">
                        {nothelpfull} people finds this unhelpfull
                    </Badge>
                    <Form className="d-flex align-content-stretch flex-row gap-2">


                        {memory.owner === address &&
                            <Button
                                variant="outline-danger"
                                onClick={() => deleteMemory(memory)}
                                className="btn"
                            >
                                <i className="bi bi-trash"></i>
                            </Button>
                        }

                    </Form>
                    {memory.owner !== address &&
                        <Button
                            variant="primary mt-2"
                            onClick={() => Helpfull(memory)}
                            className="btn"
                        >
                            Helpfull
                        </Button>
                    }

                    {memory.owner !== address &&
                        <Button
                            variant="danger"
                            onClick={() => notHelpfull(memory)}
                            className="btn"
                        >
                            Not Helpfull
                        </Button>
                    }

                    {memory.owner === address &&
                        <Form>
                            <FloatingLabel
                                controlId="inputDescription"
                                label="description"
                                className="mb-3"
                            >
                                <Form.Control
                                    type="text"
                                    onChange={(e) => {
                                        setNewDescription(e.target.value);
                                    }}
                                    placeholder="Enter New Description"
                                />
                            </FloatingLabel>
                            <Button
                                variant="outline-danger"
                                onClick={() => editMemory(memory, newdescription)}
                                className="btn"
                            >
                                edit Memory
                            </Button>


                        </Form>
                    }



                </Card.Body>
            </Card>
        </Col>
    );
};

Memory.propTypes = {
    address: PropTypes.string.isRequired,
    memory: PropTypes.instanceOf(Object).isRequired,
    helpfull: PropTypes.func.isRequired,
    nothelpfull: PropTypes.func.isRequired,
    editMemory: PropTypes.func.isRequired,
    deleteMemory: PropTypes.func.isRequired
};

export default Memory;
