import React from "react";
import AddRelationDialog from "./AddRelationDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  childId: string;
};

export default function AddParentDialog(props: Props) {
  return <AddRelationDialog variant="add-parent" {...props} />;
}