import React from "react";
import AddRelationDialog from "./AddRelationDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  parentId: string;
};

export default function AddChildDialog(props: Props) {
  return <AddRelationDialog variant="add-child" {...props} />;
}