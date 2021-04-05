import React from "react";
import { Link } from "react-router-dom";

export default () => {
	return (
		<div>
			<span> I'm some other page! </span>
			<Link to='/'>Go back home</Link>
		</div>
	);
};
