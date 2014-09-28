(function( $, undefined ) {
	"use strict"
	$(document).ready(function(){
		var $loadingItem = $('#loading');

		// Datepicker
		// $("#datepicker").datepicker({
		// 	onSelect : setFocusInp
		// });
		// $("#datepicker2").datepicker({
		// 	onSelect : setFocusInp
		// });

		//Table sorter
		//.tablesorter();

		//Placeholders
		//$('input[placeholder], textarea[placeholder]').placeholder();

		//Get and set time in cookie
		function setTimeCookie(){
			var	d = new Date();
			//Time zone
			var	timeZone = -d.getTimezoneOffset()/60;
			//Record timezone in cookies
			$.cookie('timeZone', timeZone);
		}
		setTimeCookie();

		//Flour number
		function floorN(x, n){
			var numb = Number(x);
			return numb.toFixed(n);
		}

		//Regexp
		var regexp = {
			numb : /^\b\d+\b$/i,
			floatNumb : /^\b[0-9]*\.?[0-9]{1,2}\b$/i,
			notEmpty : /.+/
		};

		//Data validate
		$(document).delegate('[data-validate-type]', 'focusout', function(){
			var $this = $(this),
				validatorType = $this.data('validate-type'),
				checkValue = $this.val(),
				checkTag = $this.prop('tagName');

			if(validatorType !== 'none'){
				if($this.prop('tagName') == 'SELECT'){
					if($this.find(':selected').text() !== $this.find(':first').text())
						$this.closest('.ws-field').removeClass('data-error');
					else
						$this.closest('.ws-field').addClass('data-error');
				}
				else{
					if((regexp[validatorType]).test(checkValue))
						$this.closest('.ws-field').removeClass('data-error');
					else
						$this.closest('.ws-field').addClass('data-error');
				}
			}
		});

		//Ajax loader
		var loader = {
			loaderSelector: '#loading',
			errorSelector: '#errorAjax',
			getPos: function (e){
				e.preventDefault();
				var yPosLoad = e.pageY+7,
					xPosLoad = e.pageX+7;
				$loadingItem.css({'top' : yPosLoad+7, 'left' : xPosLoad+7, 'display' : 'block'});
			},
			on: function(){
				var obj = this;
				$(window).on('mousemove', function(e){
					obj.getPos.apply(obj, e);
				});
			},
			off: function(){
				$(window).unbind('mousemove');
			}
		}
		

		//Constructor for AJAX forms
		function ajaxForm(element){
			var obj = this;

			obj.datas = {};
			obj.ajaxSend = function(){
				$(element).live('click', function(e){
					e.preventDefault();
					var $this = $(this),
						$closestForm = $this.closest('form'),
						urlAction = $closestForm.attr('action');

					$closestForm.find('[data-validate-type]').trigger('focusout');
					
					var formErrors = $closestForm.find('.data-error');

					if(formErrors.length > 0){
						console.log('error');
					}
					else{
						$(window).on('mousemove', function(e){
							getLoaderPos(e);
						});

						$closestForm.find('[name]').each(function(){
							var $this = $(this),
								elVal = $this.val();

							if($this.prop('tagName') == 'SELECT' && $this.find(':selected').val() == $this.find(':first').val())
								elVal = '';

							obj.datas[$this.attr('name')] = {
								id : $this.attr('name'),
								val : elVal,
								label : $this.attr('placeholder')
							}
						});

						$.ajax({
							type: 'GET',
							url: $closestForm.attr('action'),
							data: obj.datas,
							success: function(res){
								$loadingItem.css('display', 'none');
								$(window).unbind('mousemove');
								obj.ajaxSucces(res);
							},
							error: function(){
								obj.ajaxError();
							}
						})
					}

				})

			};
			obj.ajaxSucces = function(res){
				console.log(res);
			};
			obj.ajaxError = function(){
				console.log('Ajax error');
			};
		};

		//Add room ajax
		var addRoom = new ajaxForm('#addRoom');
		addRoom.ajaxSend();
		addRoom.ajaxSucces = function(res){
			$('#searchRoom').trigger('click');
		}

		//Save room's changes ajax
		var saveChanges = new ajaxForm('#saveRoom');

		//Search rooms ajax
		var searchRoom = new ajaxForm('#searchRoom');
		searchRoom.ajaxSend();
		searchRoom.ajaxSucces = function(res){
			$('.main-rooms tbody tr').remove();

			$.each(res, function(i, value){
				var roomItem = '<tr id='+ value._id +'>\
					<td class="town">'+ value.town +'</td>\
					<td class="region">'+ value.region +'</td>\
					<td class="street">'+ value.street +'</td>\
					<td class="numbRoom">'+ value.numbRoom +'</td>\
					<td class="floor">'+ value.floor +'</td>\
					<td class="buildFloors">'+ value.buildFloors +'</td>\
					<td class="space">'+ value.space +'</td>\
					<td class="livingSpace">'+ value.livingSpace +'</td>\
					<td class="kitchenSpace">'+ value.kitchenSpace +'</td>\
					<td class="balcony">'+ value.balcony +'</td>\
					<td class="bathroom">'+ value.bathroom +'</td>\
					<td class="condition">'+ value.condition +'</td>\
					<td class="price">'+ value.price +'</td>\
					<td class="auction">'+ value.auction +'</td>\
					<td class="saleStage">'+ value.saleStage +'</td>\
					<td class="notes">'+ value.notes +'</td>\
					<td class="publishDate">'+ value.publishDate.faoormatedDate +'</td>\
					<td class="actionButtons">\
						<span class="edit" title="Изменить">Изменить</span>\
						<span class="remove" title="Удалить">Удалить</span>\
					</td>\
					</tr>';
				$('.main-rooms').append(roomItem);
			});
			$('#slideSearchRoomSection.arrow-right').trigger('click');
		}

		//Remove element
		$('.remove').live('click', function(){
			var $parentTr = $(this).closest('tr'),
				delID = { delID : $parentTr.attr('id')};

			$.ajax({
				type: 'GET',
				url: '/delRoom',
				data: delID,
				success: function(res){
					$parentTr.fadeOut(200, function(){
						$(this).remove();
					});
				},
				error: function(){
					console.log('Ajax error');
				}
			})
		});

		//Edit element
		$('.edit').live('click', function(){
			var $parentTr = $(this).closest('tr'),
				$editPopup = $('#editPopup');

			$editPopup.find('[name="id"]').val($parentTr.attr('id'));
			$parentTr.find('td').each(function(i, value){
				var $this = $(this);
				if($this.attr('class') !== 'actionButtons'){
					var $elementForInput = $editPopup.find('.'+$this.attr('class')),
						typeElementForInput = $elementForInput.attr('type');

					if(typeElementForInput == 'select'){
						$elementForInput.find('option:selected').each(function(){
							$(this).removeAttr('selected');
						});
						if($this.text() !== '')
							$elementForInput.find("[value='"+$this.text()+"']").attr("selected", "selected");
						else
							$elementForInput.find('option:first').attr("selected", "selected");
					}
					else{
						$elementForInput.val($this.text());
					}
				}
			});
			$editPopup.fadeIn();

			saveChanges.ajaxSend();
			saveChanges.ajaxSucces = function(res){
				$parentTr.find('.town').text(res.town.val);
				$parentTr.find('.region').text(res.region.val);
				$parentTr.find('.street').text(res.street.val);
				$parentTr.find('.numbRoom').text(res.numbRoom.val);
				$parentTr.find('.floor').text(res.floor.val);
				$parentTr.find('.buildFloors').text(res.buildFloors.val);
				$parentTr.find('.space').text(res.space.val);
				$parentTr.find('.livingSpace').text(res.livingSpace.val);
				$parentTr.find('.kitchenSpace').text(res.kitchenSpace.val);
				$parentTr.find('.balcony').text(res.balcony.val);
				$parentTr.find('.bathroom').text(res.bathroom.val);
				$parentTr.find('.condition').text(res.condition.val);
				$parentTr.find('.price').text(res.price.val);
				$parentTr.find('.auction').text(res.auction.val);
				$parentTr.find('.saleStage').text(res.saleStage.val);
				$parentTr.find('.notes').text(res.notes.val);
				$editPopup.fadeOut();
			}
		})

		//Close popup window
		$('.close').live('click', function(){
			clearForm($(this));
			$(this).closest('div').fadeOut();
		})

		//Clear forms
		function clearForm($this){
			var $parentForm = $this.closest('form');

			$parentForm.find('[name]').each(function(){
				var $this = $(this);

				if($this.prop('tagName') == 'SELECT')
					$this.find('option:first').attr("selected", "selected");
				else
					$this.val('');
				$this.closest('.ws-field').removeClass('data-error');
			});
		}

		//Clear search form
		$('#searshSection .clearForm').live('click', function(){
			clearForm($(this));
			$('#searchRoom').trigger('click');

		});

		//Clear addRoom form
		$('#addItemSection .clearForm').live('click', function(){
			clearForm($(this));
		});

		$('#slideAddRoomSection.arrow-right').live('click', function(){
			$('#addItemSection').animate({
				left: 0
			}, function(){
				$('#slideAddRoomSection').addClass('arrow-left');
				$('#slideAddRoomSection').removeClass('arrow-right');
			});
		});

		$('#slideAddRoomSection.arrow-left').live('click', function(){
			clearForm($(this));
			$('#addItemSection').animate({
				left: -($('#addItemSection').width())-1
			}, function(){
				$('#slideAddRoomSection').removeClass('arrow-left');
				$('#slideAddRoomSection').addClass('arrow-right');
			});
		})

		$('#slideSearchRoomSection.arrow-left').live('click', function(){
			$('#searshSection').animate({
				right: 0
			}, function(){
				$('#slideSearchRoomSection').addClass('arrow-right');
				$('#slideSearchRoomSection').removeClass('arrow-left');
			});
		});
		$('#slideSearchRoomSection.arrow-right').live('click', function(){
			$('#searshSection').animate({
				right: -($('#searshSection').width())-1
			}, function(){
				$('#slideSearchRoomSection').removeClass('arrow-right');
				$('#slideSearchRoomSection').addClass('arrow-left');
			});
		})
	});
})(jQuery);