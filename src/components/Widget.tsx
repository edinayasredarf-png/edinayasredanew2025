'use client';
import React from 'react';

interface WidgetProps {
	token: string;
	width?: string | number;
	height?: string | number;
}

const WidgetIframe: React.FC<WidgetProps> = ({ token, width = '100%', height = 600 }) => {
	return (
		<div style={{ width, height, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
			<iframe
				src={`https://edinayasreda.ru/widget-api/widgetInfo/${token}`}
				width="100%"
				height="100%"
				style={{ border: 'none' }}
				title="Единая среда виджет"
				allow="geolocation *"
				referrerPolicy="no-referrer-when-downgrade"
			/>
		</div>
	);
};

export default WidgetIframe;
