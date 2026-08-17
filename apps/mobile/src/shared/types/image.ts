export type ImageFile = {
	uri: string;
	type: string;
	name: string;
};

export type EditableImage = {
	id: string;
	uri: string;
	file?: ImageFile;
};
